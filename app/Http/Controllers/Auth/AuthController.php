<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if (Auth::attempt([
            'username' => $credentials['username'],
            'password' => $credentials['password'],
            'activo' => true
        ])) {
            $request->session()->regenerate();

            $user = Auth::user();

            $user->ultimo_acceso = now();
            $user->save();

            $base = $user->password_changed_at ?: $user->created_at;
            if (!$base || \Carbon\Carbon::parse($base)->lte(now()->subDays(14))) {
                $request->session()->put('must_change_password', true);
            }

            \App\Models\Auditoria::create([
                'usuario'    => $user->username,
                'accion'     => 'login',
                'descripcion'=> 'Inicio de sesion exitoso',
                'ip_address' => $request->ip(),
            ]);

            if ($request->ajax() || $request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'role' => $user->role,
                    'redirect' => $user->role === 'admin' ? '/admin/dashboard' : '/user/dashboard',
                    'csrf_token' => csrf_token(),
                    'password_expired' => $request->session()->has('must_change_password'),
                ]);
            }

            if ($user->role === 'admin') {
                return redirect()->intended('admin/dashboard');
            }

            return redirect()->intended('user/dashboard');
        }

        if ($request->ajax() || $request->wantsJson()) {
            return response()->json(['success' => false, 'message' => 'Credenciales incorrectas.'], 401);
        }

        return back()->withErrors([
            'username' => 'Credenciales incorrectas.',
        ])->onlyInput('username');
    }

    public function logout(Request $request)
    {
        $user = Auth::user();

        if ($user) {
            \App\Models\Auditoria::create([
                'usuario'    => $user->username,
                'accion'     => 'logout',
                'descripcion'=> 'Cierre de sesion',
                'ip_address' => $request->ip(),
            ]);

            \App\Models\Bloqueo::where('usuario', $user->username)
                ->where('activo', true)
                ->update(['activo' => false]);
        }

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function keepAlive(Request $request)
    {
        $request->session()->put('last_activity', time());
        return response()->json(['ok' => true]);
    }
}

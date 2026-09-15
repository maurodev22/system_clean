<?php

namespace App\Http\Controllers;

use App\Models\SystemUser;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UsuarioController extends Controller
{
    public function index()
    {
        $data = SystemUser::selectRaw("
            id, username, role, full_name, activo,
            TO_CHAR(ultimo_acceso, 'DD/MM/YYYY HH24:MI') as ultimo_acceso_fmt,
            TO_CHAR(created_at, 'DD/MM/YYYY') as created_at_fmt
        ")
        ->orderBy('id')
        ->get()
        ->map(function ($u) {
            return [
                'id' => $u->id,
                'username' => $u->username,
                'role' => $u->role,
                'full_name' => $u->full_name,
                'activo' => $u->activo,
                'ultimo_acceso' => $u->ultimo_acceso_fmt,
                'created_at' => $u->created_at_fmt,
            ];
        });

        return response()->json(['data' => $data]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'username' => 'required|string|min:3|max:100|unique:system_users,username',
            'password' => 'required|string|min:6|not_in:123456',
            'role' => 'required|in:especialista',
            'full_name' => 'nullable|string|max:200',
        ]);

        SystemUser::create([
            'username' => $data['username'],
            'password_hash' => Hash::make($data['password']),
            'role' => $data['role'],
            'full_name' => $data['full_name'] ?? $data['username'],
            'password_changed_at' => now(),
        ]);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'agregar_usuario',
            'descripcion' => "Usuario '{$data['username']}' creado con rol {$data['role']}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function update(Request $request, $id)
    {
        $user = SystemUser::findOrFail($id);

        $data = $request->validate([
            'role' => 'nullable|in:especialista',
            'full_name' => 'nullable|string|max:200',
            'password' => 'nullable|string|min:6|not_in:123456',
            'activo' => 'boolean',
        ]);

        $currentUser = Auth::user();
        $isOwnAccount = $user->username === $currentUser->username;

        $updateData = [];

        if (isset($data['role'])) $updateData['role'] = $data['role'];
        if (isset($data['full_name'])) $updateData['full_name'] = $data['full_name'];
        if (isset($data['activo'])) $updateData['activo'] = $data['activo'];

        if (!empty($data['password'])) {
            if ($isOwnAccount && $user->password_changed_at) {
                $lastChange = strtotime($user->password_changed_at);
                $oneWeekLater = $lastChange + (7 * 24 * 60 * 60);
                if (time() < $oneWeekLater) {
                    $restante = ceil(($oneWeekLater - time()) / 3600);
                    return response()->json([
                        'error' => "Debe esperar 1 semana entre cambios de contrasena. Faltan aproximadamente $restante hora(s)."
                    ]);
                }
            }
            $updateData['password_hash'] = Hash::make($data['password']);
            $updateData['password_changed_at'] = now();
        }

        if (empty($updateData)) {
            return response()->json(['error' => 'No hay datos para actualizar']);
        }

        $user->update($updateData);

        $desc = "Usuario ID $id actualizado";
        if (!empty($data['password'])) {
            $desc = "Contrasena del usuario ID $id actualizada por {$currentUser->username}";
        }

        Auditoria::create([
            'usuario' => $currentUser->username,
            'accion' => 'editar_usuario',
            'descripcion' => $desc,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function destroy(Request $request, $id)
    {
        $target = SystemUser::findOrFail($id);

        if ($target->username === Auth::user()->username) {
            return response()->json(['error' => 'No puede eliminarse a si mismo']);
        }

        $target->delete();

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'eliminar_usuario',
            'descripcion' => "Usuario '{$target->username}' eliminado",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function cambiarPassword(Request $request)
    {
        $data = $request->validate([
            'password' => 'required|string|min:6|not_in:123456',
        ]);

        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Sesion no valida'], 401);
        }

        if (Hash::check($data['password'], $user->password_hash)) {
            return response()->json(['error' => 'La nueva contrasena debe ser diferente a la anterior']);
        }

        $user->password_hash = Hash::make($data['password']);
        $user->password_changed_at = now();
        $user->save();

        $request->session()->forget('must_change_password');

        Auditoria::create([
            'usuario' => $user->username,
            'accion' => 'cambiar_password',
            'descripcion' => 'Contrasena actualizada (vencida)',
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }
}

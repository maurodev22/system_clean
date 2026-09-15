<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use App\Models\SystemUser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditoriaController extends Controller
{
    public function index()
    {
        $data = DB::select("
            SELECT a.*, t.nombre as trabajador_nombre
            FROM auditoria a
            LEFT JOIN trabajadores t ON a.trabajador_id = t.id
            ORDER BY a.fecha_hora DESC
            LIMIT 500
        ");

        return response()->json(['data' => $data]);
    }

    public function stats()
    {
        $total = Auditoria::count();
        $logins = Auditoria::where('accion', 'login')->count();
        $ediciones = Auditoria::where('accion', 'editar')->count();

        $porUsuario = DB::select("
            SELECT usuario, COUNT(*) as total
            FROM auditoria
            GROUP BY usuario
            ORDER BY total DESC
            LIMIT 10
        ");

        $usuariosActivos = SystemUser::where('activo', true)->count();

        return response()->json([
            'total' => $total,
            'logins' => $logins,
            'ediciones' => $ediciones,
            'por_usuario' => $porUsuario,
            'usuarios_activos_sistema' => $usuariosActivos,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Donacion;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class DonanteController extends Controller
{
    public function index()
    {
        $data = DB::select("
            SELECT d.*, t.nombre as trabajador_nombre, t.id_numerico, t.cargo, t.sexo,
                   t.fecha_nacimiento, t.unidad_organizativa,
                   div.nombre as division_nombre,
                   (d.fecha_donacion + INTERVAL '3 months')::DATE as proxima_donacion,
                   CASE WHEN (d.fecha_donacion + INTERVAL '3 months')::DATE <= CURRENT_DATE
                        THEN TRUE ELSE FALSE END as puede_donar,
                   MAX(d.fecha_donacion) OVER (PARTITION BY d.trabajador_id) as worker_ultima_fecha,
                   CASE WHEN (MAX(d.fecha_donacion) OVER (PARTITION BY d.trabajador_id) + INTERVAL '3 months')::DATE <= CURRENT_DATE
                        THEN TRUE ELSE FALSE END as worker_puede_donar
            FROM donaciones_sangre d
            JOIN trabajadores t ON d.trabajador_id = t.id
            LEFT JOIN divisiones div ON t.division_id = div.id
            ORDER BY d.fecha_donacion DESC
        ");

        return response()->json(['data' => $data, 'total' => count($data)]);
    }

    public function show($id)
    {
        $data = DB::selectOne("
            SELECT d.*, t.nombre as trabajador_nombre, t.id_numerico
            FROM donaciones_sangre d
            JOIN trabajadores t ON d.trabajador_id = t.id
            WHERE d.id = ?
        ", [$id]);

        if (!$data) {
            return response()->json(['error' => 'Donacion no encontrada'], 404);
        }

        return response()->json($data);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'trabajador_id' => 'required|exists:trabajadores,id',
            'fecha_donacion' => 'required|date',
            'tipo_sangre' => 'required|string|max:5',
            'recibio_estimulo' => 'boolean',
            'observaciones' => 'nullable|string',
        ]);

        $ultima = Donacion::where('trabajador_id', $data['trabajador_id'])
            ->max('fecha_donacion');

        if ($ultima) {
            $ultimaFecha = new \DateTime($ultima);
            $nuevaFecha = new \DateTime($data['fecha_donacion']);
            $diff = $ultimaFecha->diff($nuevaFecha);
            $meses = $diff->m + ($diff->y * 12);
            if ($meses < 3) {
                return response()->json(['error' => 'Deben pasar al menos 3 meses entre donaciones']);
            }
        }

        Donacion::create($data);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'agregar',
            'descripcion' => "Donacion registrada para trabajador ID {$data['trabajador_id']}",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function update(Request $request, $id)
    {
        $donacion = Donacion::findOrFail($id);

        $data = $request->validate([
            'fecha_donacion' => 'required|date',
            'tipo_sangre' => 'nullable|string|max:5',
            'recibio_estimulo' => 'boolean',
        ]);

        $fechaObj = new \DateTime($data['fecha_donacion']);
        if ($fechaObj > new \DateTime()) {
            return response()->json(['error' => 'La fecha de donacion no puede ser futura']);
        }

        $updateData = ['fecha_donacion' => $data['fecha_donacion']];
        if (!empty($data['tipo_sangre'])) {
            $updateData['tipo_sangre'] = $data['tipo_sangre'];
        }
        if (isset($data['recibio_estimulo'])) {
            $updateData['recibio_estimulo'] = $data['recibio_estimulo'];
        }

        $donacion->update($updateData);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'editar',
            'descripcion' => "Donacion ID $id editada",
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function search(Request $request)
    {
        $q = $request->get('q', '');
        if (!$q) {
            return response()->json(['data' => []]);
        }

        $data = Donacion::join('trabajadores', 'donaciones_sangre.trabajador_id', '=', 'trabajadores.id')
            ->where(function ($query) use ($q) {
                $query->where('trabajadores.nombre', 'ilike', "%{$q}%")
                      ->orWhere('trabajadores.id_numerico', 'ilike', "%{$q}%");
            })
            ->select('donaciones_sangre.*', 'trabajadores.nombre as trabajador_nombre', 'trabajadores.id_numerico')
            ->orderBy('donaciones_sangre.fecha_donacion', 'desc')
            ->limit(20)
            ->get();

        return response()->json(['data' => $data]);
    }

    public function checkWorker($trabajadorId)
    {
        $ultima = Donacion::where('trabajador_id', $trabajadorId)
            ->max('fecha_donacion');

        $result = ['tiene_donaciones' => false];

        if ($ultima) {
            $result['tiene_donaciones'] = true;
            $result['ultima_donacion'] = $ultima;
            $fecha = new \DateTime($ultima);
            $diff = $fecha->diff(new \DateTime());
            $result['puede_donar'] = ($diff->m + ($diff->y * 12)) >= 3;
        }

        return response()->json($result);
    }

    public function stats()
    {
        $totalDonaciones = Donacion::count();
        $donantesUnicos = Donacion::distinct('trabajador_id')->count('trabajador_id');
        $conEstimulo = Donacion::where('recibio_estimulo', true)->count();

        $puedenDonar = DB::selectOne("
            SELECT COUNT(DISTINCT trabajador_id) as c
            FROM donaciones_sangre
            WHERE (fecha_donacion + INTERVAL '3 months') <= CURRENT_DATE
        ");

        $porTipoSangre = DB::select("
            SELECT tipo_sangre, COUNT(*) as total
            FROM donaciones_sangre
            GROUP BY tipo_sangre
            ORDER BY total DESC
        ");

        $porMes = DB::select("
            SELECT TO_CHAR(fecha_donacion, 'YYYY-MM') as mes, COUNT(*) as total
            FROM donaciones_sangre
            GROUP BY mes
            ORDER BY mes DESC
            LIMIT 12
        ");

        return response()->json([
            'total_donaciones' => (int) $totalDonaciones,
            'donantes_unicos' => (int) $donantesUnicos,
            'con_estimulo' => (int) $conEstimulo,
            'pueden_donar' => (int) ($puedenDonar->c ?? 0),
            'por_tipo_sangre' => $porTipoSangre,
            'por_mes' => $porMes,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Models\Division;
use App\Models\Enfermedad;
use App\Models\Auditoria;
use App\Models\Bloqueo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TrabajadorController extends Controller
{
    public function userDashboard()
    {
        return view('user.dashboard');
    }

    public function adminDashboard()
    {
        return view('admin.dashboard');
    }

    public function index(Request $request)
    {
        $division   = $request->get('division');
        $altoriesgo = $request->get('altoriesgo');
        $uo         = $request->get('uo');
        $page       = max(1, (int) $request->get('page', 1));
        $perPage    = max(10, min(100, (int) $request->get('per_page', 20)));

        $query = Trabajador::with(['division', 'enfermedades'])
            ->where('activo', true);

        if ($division) {
            $query->where('division_id', $division);
        }
        if ($altoriesgo) {
            $query->where('tipo_alto_riesgo', $altoriesgo)
                  ->where('es_alto_riesgo', true);
        }
        if ($uo) {
            if ($uo === 'Sin asignar') {
                $query->whereNotIn('id', $this->catalogWorkerIds());
            } else {
                $query->where('unidad_organizativa', $uo);
            }
        }

        $total = $query->count();

        $trabajadores = $query->orderBy('nombre')
            ->paginate($perPage, ['*'], 'page', $page);

        $trabajadores->getCollection()->transform(function ($t) {
            $t->division_nombre = $t->division->nombre ?? null;
            $t->enfermedades_lista = $t->enfermedades->pluck('nombre')->implode(', ');
            return $t;
        });

        return response()->json([
            'data' => $trabajadores->items(),
            'total' => $total,
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => $trabajadores->lastPage(),
        ]);
    }

    public function show($id)
    {
        $trabajador = Trabajador::with('division', 'enfermedades')->findOrFail($id);
        $esDonante = $trabajador->donaciones()->exists();

        return response()->json([
            'id' => $trabajador->id,
            'id_numerico' => $trabajador->id_numerico,
            'nombre' => $trabajador->nombre,
            'fecha_nacimiento' => $trabajador->fecha_nacimiento,
            'cargo' => $trabajador->cargo,
            'unidad_organizativa' => $trabajador->unidad_organizativa,
            'division_id' => $trabajador->division_id,
            'division_nombre' => $trabajador->division->nombre ?? null,
            'sexo' => $trabajador->sexo,
            'es_alto_riesgo' => $trabajador->es_alto_riesgo,
            'tipo_alto_riesgo' => $trabajador->tipo_alto_riesgo,
            'subcategoria_operario' => $trabajador->subcategoria_operario,
            'subcategoria_chofer' => $trabajador->subcategoria_chofer,
            'fecha_ultimo_chequeo' => $trabajador->fecha_ultimo_chequeo,
            'embarazada' => $trabajador->embarazada,
            'periodo_maternidad_inicio' => $trabajador->periodo_maternidad_inicio,
            'periodo_maternidad_fin' => $trabajador->periodo_maternidad_fin,
            'fecha_recalificacion' => $trabajador->fecha_recalificacion,
            'fecha_examen_psicofisiologico' => $trabajador->fecha_examen_psicofisiologico,
            'fecha_chequeo_especializado' => $trabajador->fecha_chequeo_especializado,
            'fecha_chequeo_chofer' => $trabajador->fecha_chequeo_chofer,
            'fecha_gestacion_inicio' => $trabajador->fecha_gestacion_inicio,
            'maternidad_estado_manual' => $trabajador->maternidad_estado_manual,
            'tipo_sangre' => $trabajador->tipo_sangre,
            'es_donante' => $esDonante,
            'enfermedades_ids' => $trabajador->enfermedades->pluck('id')->toArray(),
            'enfermedades_lista' => $trabajador->enfermedades->pluck('nombre')->implode(', '),
            'activo' => $trabajador->activo,
            'created_at' => $trabajador->created_at,
            'updated_at' => $trabajador->updated_at,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'id_numerico' => 'required|string|max:20|unique:trabajadores,id_numerico',
            'nombre' => 'required|string|max:200',
            'fecha_nacimiento' => 'required|date',
            'cargo' => 'required|string|max:150',
            'unidad_organizativa' => 'nullable|string|max:200',
            'division_id' => 'nullable|exists:divisiones,id',
            'sexo' => 'required|in:1,2',
            'es_alto_riesgo' => 'boolean',
            'tipo_alto_riesgo' => 'nullable|string|max:50',
            'subcategoria_operario' => 'nullable|string|max:5',
            'subcategoria_chofer' => 'nullable|string|max:10',
            'fecha_ultimo_chequeo' => 'nullable|date',
            'embarazada' => 'boolean',
            'fecha_gestacion_inicio' => 'nullable|date',
            'periodo_maternidad_inicio' => 'nullable|date',
            'periodo_maternidad_fin' => 'nullable|date',
            'fecha_recalificacion' => 'nullable|date',
            'fecha_examen_psicofisiologico' => 'nullable|date',
            'fecha_chequeo_especializado' => 'nullable|date',
            'tipo_sangre' => 'nullable|string|max:5',
            'enfermedades' => 'nullable|array',
            'enfermedades.*' => 'exists:enfermedades,id',
        ]);

        $trabajador = Trabajador::create($data);

        if (!empty($data['fecha_gestacion_inicio'])) {
            $inicio = \Carbon\Carbon::parse($data['fecha_gestacion_inicio']);
            $trabajador->update([
                'periodo_maternidad_inicio' => $inicio->copy()->addMonths(6)->toDateString(),
                'periodo_maternidad_fin' => $inicio->copy()->addMonths(18)->toDateString(),
            ]);
        }

        if (!empty($data['enfermedades'])) {
            $trabajador->enfermedades()->sync($data['enfermedades']);
        }

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'agregar',
            'descripcion' => "Trabajador {$trabajador->nombre} creado",
            'trabajador_id' => $trabajador->id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'id' => $trabajador->id]);
    }

    public function update(Request $request, $id)
    {
        $trabajador = Trabajador::findOrFail($id);

        $lockCheck = Bloqueo::where('recurso_tipo', 'editar')
            ->where('recurso_id', $id)
            ->where('activo', true)
            ->first();

        if ($lockCheck && $lockCheck->usuario !== Auth::user()->username) {
            return response()->json([
                'error' => "El trabajador esta siendo editado por: {$lockCheck->usuario}. Espere a que termine o intente mas tarde."
            ], 409);
        }

        $data = $request->validate([
            'tipo_sangre' => 'nullable|string|max:5',
            'fecha_ultimo_chequeo' => 'nullable|date',
            'fecha_chequeo_chofer' => 'nullable|date',
            'cargo' => 'nullable|string|max:150',
            'unidad_organizativa' => 'nullable|string|max:200',
            'enfermedades' => 'nullable|array',
            'enfermedades.*' => 'exists:enfermedades,id',
            'es_donante' => 'boolean',
            'embarazada' => 'boolean',
            'fecha_gestacion_inicio' => 'nullable|date',
        ]);

        $updateData = [
            'tipo_sangre' => $data['tipo_sangre'] ?? $trabajador->tipo_sangre,
            'fecha_ultimo_chequeo' => $data['fecha_ultimo_chequeo'] ?? $trabajador->fecha_ultimo_chequeo,
            'fecha_chequeo_chofer' => $data['fecha_chequeo_chofer'] ?? $trabajador->fecha_chequeo_chofer,
        ];

        if (array_key_exists('embarazada', $data)) {
            $updateData['embarazada'] = $data['embarazada'];
        }

        if (array_key_exists('fecha_gestacion_inicio', $data)) {
            $updateData['fecha_gestacion_inicio'] = $data['fecha_gestacion_inicio'] ?: null;
            if ($updateData['fecha_gestacion_inicio']) {
                $inicio = \Carbon\Carbon::parse($updateData['fecha_gestacion_inicio']);
                $updateData['periodo_maternidad_inicio'] = $inicio->copy()->addMonths(6)->toDateString();
                $updateData['periodo_maternidad_fin'] = $inicio->copy()->addMonths(18)->toDateString();
            } else {
                $updateData['periodo_maternidad_inicio'] = null;
                $updateData['periodo_maternidad_fin'] = null;
            }
        }

        if (array_key_exists('cargo', $data)) {
            $cargo = trim((string) $data['cargo']) ?: null;
            $updateData['cargo'] = $cargo;
            $updateData = array_merge($updateData, $this->riesgoFromPosicion($cargo));
        }

        if (array_key_exists('unidad_organizativa', $data)) {
            $updateData['unidad_organizativa'] = trim((string) $data['unidad_organizativa']) ?: null;
        }

        $trabajador->update($updateData);

        if (isset($data['enfermedades'])) {
            $trabajador->enfermedades()->sync($data['enfermedades']);
        }

        if (!empty($data['tipo_sangre'])) {
            DB::table('donaciones_sangre')
                ->where('trabajador_id', $id)
                ->where(function ($q) use ($data) {
                    $q->whereNull('tipo_sangre')
                      ->orWhere('tipo_sangre', '!=', $data['tipo_sangre']);
                })
                ->update(['tipo_sangre' => $data['tipo_sangre']]);
        }

        if (!empty($data['es_donante'])) {
            $existe = $trabajador->donaciones()->exists();
            if (!$existe) {
                $ts = $data['tipo_sangre'] ?? $trabajador->tipo_sangre ?? 'O+';
                $trabajador->donaciones()->create([
                    'fecha_donacion' => now(),
                    'tipo_sangre' => $ts,
                    'recibio_estimulo' => false,
                    'observaciones' => 'Designado desde edicion de trabajador',
                ]);
            }
        }

        Bloqueo::where('recurso_tipo', 'editar')
            ->where('recurso_id', $id)
            ->where('usuario', Auth::user()->username)
            ->where('activo', true)
            ->update(['activo' => false]);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'editar',
            'descripcion' => "Trabajador ID $id editado (enfermedades/tipo_sangre/chequeo/donante)",
            'trabajador_id' => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function maternidad()
    {
        $hoy = \Carbon\Carbon::today();

        $data = Trabajador::with('division')
            ->where('activo', true)
            ->where(function ($q) {
                $q->where('embarazada', true)
                  ->orWhereNotNull('fecha_gestacion_inicio');
            })
            ->orderBy('nombre')
            ->get()
            ->map(function ($t) use ($hoy) {
                $inicio = $t->fecha_gestacion_inicio ? \Carbon\Carbon::parse($t->fecha_gestacion_inicio) : null;
                $licenciaInicio = $inicio ? $inicio->copy()->addMonths(6) : null;
                $licenciaFin = $inicio ? $inicio->copy()->addMonths(18) : null;

                $mesGestacion = null;
                if ($inicio) {
                    $diff = $inicio->diffInMonths($hoy);
                    $mesGestacion = max(0, min(9, $diff));
                }

                $estado = null;
                if ($inicio) {
                    if ($hoy->lt($licenciaInicio)) {
                        $estado = 'a_otorgar';
                    } elseif ($hoy->lt($licenciaFin->copy()->subMonth())) {
                        $estado = 'otorgado';
                    } else {
                        $estado = 'a_incorporacion';
                    }
                } elseif ($t->embarazada) {
                    $estado = 'a_otorgar';
                }

                if ($t->maternidad_estado_manual) {
                    $estado = $t->maternidad_estado_manual;
                }

                return [
                    'id' => $t->id,
                    'id_numerico' => $t->id_numerico,
                    'nombre' => $t->nombre,
                    'unidad_organizativa' => $t->unidad_organizativa,
                    'sexo' => $t->sexo,
                    'embarazada' => $t->embarazada,
                    'fecha_gestacion_inicio' => $t->fecha_gestacion_inicio ? $t->fecha_gestacion_inicio->toDateString() : null,
                    'mes_gestacion' => $mesGestacion,
                    'licencia_inicio' => $licenciaInicio ? $licenciaInicio->toDateString() : null,
                    'licencia_fin' => $licenciaFin ? $licenciaFin->toDateString() : null,
                    'estado' => $estado,
                    'estado_manual' => $t->maternidad_estado_manual,
                ];
            })
            ->filter(function ($r) {
                return $r['embarazada'] || $r['fecha_gestacion_inicio'];
            })
            ->values();

        return response()->json(['data' => $data, 'total' => count($data)]);
    }

    public function updateMaternidad(Request $request, $id)
    {
        $trabajador = Trabajador::findOrFail($id);

        $data = $request->validate([
            'embarazada' => 'boolean',
            'fecha_gestacion_inicio' => 'nullable|date',
            'maternidad_estado_manual' => 'nullable|in:a_otorgar,otorgado,a_incorporacion',
        ]);

        $update = [];

        if (array_key_exists('embarazada', $data)) {
            $update['embarazada'] = $data['embarazada'];
        }

        if (array_key_exists('fecha_gestacion_inicio', $data)) {
            $update['fecha_gestacion_inicio'] = $data['fecha_gestacion_inicio'] ?: null;
            if ($update['fecha_gestacion_inicio']) {
                $inicio = \Carbon\Carbon::parse($update['fecha_gestacion_inicio']);
                $update['periodo_maternidad_inicio'] = $inicio->copy()->addMonths(6)->toDateString();
                $update['periodo_maternidad_fin'] = $inicio->copy()->addMonths(18)->toDateString();
            } else {
                $update['periodo_maternidad_inicio'] = null;
                $update['periodo_maternidad_fin'] = null;
            }
        }

        if (array_key_exists('maternidad_estado_manual', $data)) {
            $update['maternidad_estado_manual'] = $data['maternidad_estado_manual'] ?: null;
        }

        if (empty($update)) {
            return response()->json(['error' => 'No hay datos para actualizar']);
        }

        $trabajador->update($update);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'editar',
            'descripcion' => "Maternidad actualizada para trabajador ID $id",
            'trabajador_id' => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true]);
    }

    public function search($query)
    {
        $trabajadores = Trabajador::with('division', 'enfermedades')
            ->where('activo', true)
            ->where(function ($q) use ($query) {
                $q->where('nombre', 'ilike', "%{$query}%")
                  ->orWhere('id_numerico', 'ilike', "%{$query}%");
            })
            ->orderBy('nombre')
            ->limit(20)
            ->get()
            ->transform(function ($t) {
                $t->division_nombre = $t->division->nombre ?? null;
                $t->enfermedades_lista = $t->enfermedades->pluck('nombre')->implode(', ');
                return $t;
            });

        return response()->json(['data' => $trabajadores]);
    }

    public function byDivision($id)
    {
        $query = Trabajador::with('division', 'enfermedades')
            ->where('activo', true)
            ->where('division_id', $id);

        $total = $query->count();
        $data = $query->orderBy('nombre')->get()
            ->transform(function ($t) {
                $t->division_nombre = $t->division->nombre ?? null;
                $t->enfermedades_lista = $t->enfermedades->pluck('nombre')->implode(', ');
                return $t;
            });

        return response()->json(['data' => $data, 'total' => $total]);
    }

    public function stats()
    {
        $total = Trabajador::where('activo', true)->count();
        $altoRiesgo = Trabajador::where('activo', true)->where('es_alto_riesgo', true)->count();
        $vencido = Trabajador::where('activo', true)
            ->where(function ($q) {
                $q->whereNull('fecha_ultimo_chequeo')
                  ->orWhere('fecha_ultimo_chequeo', '<', now()->subYear());
            })
            ->count();
        $donantes = DB::table('donaciones_sangre')->distinct('trabajador_id')->count('trabajador_id');

        $hombres = Trabajador::where('activo', true)->where('sexo', 2)->count();
        $mujeres = Trabajador::where('activo', true)->where('sexo', 1)->count();

        $divisiones = Division::leftJoin('trabajadores', function ($join) {
                $join->on('divisiones.id', '=', 'trabajadores.division_id')
                     ->where('trabajadores.activo', true);
            })
            ->groupBy('divisiones.id', 'divisiones.nombre')
            ->orderBy('divisiones.nombre')
            ->selectRaw('divisiones.nombre, COUNT(trabajadores.id) as total')
            ->get();

        $unidadesOrg = Trabajador::where('activo', true)
            ->selectRaw("COALESCE(NULLIF(unidad_organizativa, ''), 'Sin asignar') as nombre, COUNT(*) as total")
            ->groupBy('unidad_organizativa')
            ->orderBy('nombre')
            ->get();

        $riesgoTipos = Trabajador::where('activo', true)->where('es_alto_riesgo', true)
            ->selectRaw("COALESCE(tipo_alto_riesgo, 'Sin asignar') as tipo, COUNT(*) as total")
            ->groupBy('tipo_alto_riesgo')
            ->orderByDesc('total')
            ->get();

        $sinFecha = Trabajador::where('activo', true)->whereNull('fecha_ultimo_chequeo')->count();

        $riesgoPorUO = Trabajador::where('activo', true)
            ->selectRaw("COALESCE(NULLIF(unidad_organizativa, ''), 'Sin asignar') as nombre")
            ->selectRaw("COUNT(*) FILTER (WHERE es_alto_riesgo = TRUE) as total")
            ->selectRaw("COUNT(*) as total_trabajadores")
            ->groupBy('unidad_organizativa')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'total' => $total,
            'alto_riesgo' => $altoRiesgo,
            'chequeo_vencido' => $vencido,
            'donantes' => $donantes,
            'hombres' => $hombres,
            'mujeres' => $mujeres,
            'divisiones' => $divisiones,
            'unidades_org' => $unidadesOrg,
            'riesgo_tipos' => $riesgoTipos,
            'chequeos' => [
                'vigentes' => $total - $vencido - $sinFecha,
                'vencidos' => $vencido,
                'sin_fecha' => $sinFecha,
            ],
            'riesgo_por_uo' => $riesgoPorUO,
        ]);
    }

    public function vencidos()
    {
        $data = Trabajador::with('division')
            ->where('activo', true)
            ->where(function ($q) {
                $q->whereNull('fecha_ultimo_chequeo')
                  ->orWhere('fecha_ultimo_chequeo', '<', now()->subYear());
            })
            ->orderBy('fecha_ultimo_chequeo')
            ->orderBy('nombre')
            ->get()
            ->transform(function ($t) {
                $t->division_nombre = $t->division->nombre ?? null;
                return $t;
            });

        return response()->json(['data' => $data, 'total' => count($data)]);
    }

    public function choferes()
    {
        $data = Trabajador::with('division')
            ->where('activo', true)
            ->where('tipo_alto_riesgo', 'chofer')
            ->orderBy('nombre')
            ->get()
            ->transform(function ($t) {
                $t->division_nombre = $t->division->nombre ?? null;
                return $t;
            });

        return response()->json(['data' => $data, 'total' => count($data)]);
    }

    public function choferesStats()
    {
        $totalChoferes = Trabajador::where('activo', true)
            ->where('tipo_alto_riesgo', 'chofer')
            ->count();

        $porDivision = Division::leftJoin('trabajadores', function ($join) {
                $join->on('divisiones.id', '=', 'trabajadores.division_id')
                     ->where('trabajadores.activo', true)
                     ->where('trabajadores.tipo_alto_riesgo', 'chofer');
            })
            ->groupBy('divisiones.id', 'divisiones.nombre')
            ->orderBy('divisiones.nombre')
            ->selectRaw('divisiones.nombre, COUNT(trabajadores.id) as total')
            ->get();

        return response()->json([
            'total' => $totalChoferes,
            'por_division' => $porDivision,
        ]);
    }

    public function divisiones()
    {
        return Division::orderBy('parent_id')->orderBy('nombre')->get();
    }

    public function enfermedades()
    {
        return Enfermedad::orderBy('nombre')->get();
    }

    public function unidadesOrganizativas()
    {
        $catalog = DB::table('unidades_organizativas')->orderBy('nombre')->get();

        $normToName = [];
        $counts = [];
        foreach ($catalog as $c) {
            $normToName[$this->normName($c->nombre)] = $c->nombre;
            $counts[$c->nombre] = 0;
        }

        $workers = Trabajador::where('activo', true)
            ->select('id', 'unidad_organizativa')
            ->get();

        $sinAsignar = 0;
        foreach ($workers as $w) {
            $key = $this->normName($w->unidad_organizativa);
            if ($key !== '' && isset($normToName[$key])) {
                $counts[$normToName[$key]]++;
            } else {
                $sinAsignar++;
            }
        }

        $data = [];
        foreach ($counts as $nombre => $total) {
            $data[] = ['unidad_organizativa' => $nombre, 'total' => $total];
        }
        if ($sinAsignar > 0) {
            $data[] = ['unidad_organizativa' => 'Sin asignar', 'total' => $sinAsignar];
        }

        return response()->json($data);
    }

    public function customStats(Request $request)
    {
        $field = $request->get('field', 'sexo');
        $altoriesgo = $request->get('altoriesgo', '');

        $fieldMap = [
            'sexo'                  => ["CASE WHEN sexo = 1 THEN 'Femenino' ELSE 'Masculino' END", 'sexo'],
            'division'              => ["COALESCE(d.nombre, 'Sin asignar')", 't.division_id, d.nombre'],
            'unidad_organizativa'   => ["COALESCE(NULLIF(t.unidad_organizativa, ''), 'Sin asignar')", 'unidad_organizativa'],
            'tipo_alto_riesgo'      => ["COALESCE(NULLIF(t.tipo_alto_riesgo, ''), 'Sin asignar')", 'tipo_alto_riesgo'],
            'tipo_sangre'           => ["COALESCE(NULLIF(t.tipo_sangre, ''), 'Sin asignar')", 'tipo_sangre'],
        ];

        $expr = 'sexo';
        $groupCol = 'sexo';
        if (isset($fieldMap[$field])) {
            list($expr, $groupCol) = $fieldMap[$field];
        }

        $where = 't.activo = TRUE';
        if ($altoriesgo === 'si') {
            $where .= ' AND t.es_alto_riesgo = TRUE';
        } elseif ($altoriesgo === 'no') {
            $where .= ' AND t.es_alto_riesgo = FALSE';
        }

        $data = DB::select("
            SELECT $expr AS etiqueta, COUNT(*) AS total
            FROM trabajadores t
            LEFT JOIN divisiones d ON t.division_id = d.id
            WHERE $where
            GROUP BY $groupCol
            ORDER BY total DESC
        ");

        $data = array_map(function ($row) {
            return ['etiqueta' => $row->etiqueta, 'total' => (int) $row->total];
        }, $data);

        return response()->json(['data' => $data]);
    }

    public function posiciones()
    {
        $data = DB::table('posiciones')->orderBy('nombre')->get();
        return response()->json(['data' => $data]);
    }

    public function exportAll()
    {
        $data = Trabajador::with('division', 'enfermedades')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get()
            ->transform(function ($t) {
                $t->division_nombre = $t->division->nombre ?? null;
                $t->enfermedades_lista = $t->enfermedades->pluck('nombre')->implode(', ');
                return $t;
            });

        return response()->json(['data' => $data]);
    }

    public function checkLock(Request $request)
    {
        $tipo = $request->get('tipo', 'editar');
        $id = (int) $request->get('id', 0);

        if ($id <= 0) {
            return response()->json(['locked' => false]);
        }

        $lock = Bloqueo::where('recurso_tipo', $tipo)
            ->where('recurso_id', $id)
            ->where('activo', true)
            ->first();

        if ($lock) {
            $restantes = $lock->fecha_expiracion ? max(0, now()->diffInSeconds($lock->fecha_expiracion, false)) : 0;
            return response()->json([
                'locked' => true,
                'usuario' => $lock->usuario,
                'restantes' => $restantes,
            ]);
        }

        return response()->json(['locked' => false]);
    }

    public function acquireLock(Request $request)
    {
        $tipo = $request->get('tipo', 'editar');
        $id = (int) $request->get('id', 0);

        if ($id <= 0) {
            return response()->json(['success' => false, 'message' => 'ID de recurso invalido']);
        }

        // Clean expired locks
        Bloqueo::where('fecha_expiracion', '<', now())
            ->where('activo', true)
            ->update(['activo' => false]);

        // Check existing
        $existing = Bloqueo::where('recurso_tipo', $tipo)
            ->where('recurso_id', $id)
            ->where('activo', true)
            ->first();

        if ($existing) {
            if ($existing->usuario === Auth::user()->username) {
                $existing->update(['activo' => false]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => "El recurso esta siendo utilizado por: {$existing->usuario}",
                    'locked_by' => $existing->usuario,
                ]);
            }
        }

        $bloqueo = Bloqueo::create([
            'recurso_tipo' => $tipo,
            'recurso_id' => $id,
            'usuario' => Auth::user()->username,
            'sesion_id' => session()->getId(),
            'fecha_expiracion' => now()->addSeconds(120),
            'activo' => true,
        ]);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'bloquear',
            'descripcion' => "Bloqueo adquirido: $tipo ID $id",
            'trabajador_id' => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'Bloqueo adquirido', 'locked_by' => null]);
    }

    public function releaseLock(Request $request)
    {
        $tipo = $request->get('tipo', 'editar');
        $id = (int) $request->get('id', 0);

        if ($id <= 0) {
            return response()->json(['success' => false, 'message' => 'ID de recurso invalido']);
        }

        Bloqueo::where('recurso_tipo', $tipo)
            ->where('recurso_id', $id)
            ->where('usuario', Auth::user()->username)
            ->where('activo', true)
            ->update(['activo' => false]);

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'desbloquear',
            'descripcion' => "Bloqueo liberado: $tipo ID $id",
            'trabajador_id' => $id,
            'ip_address' => $request->ip(),
        ]);

        return response()->json(['success' => true, 'message' => 'Bloqueo liberado']);
    }

    private function normName($s)
    {
        $s = mb_strtolower(trim((string) $s));
        $s = str_replace(["“", "”", "‘", "’", '"', "'"], '', $s);
        $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        $s = preg_replace('/[^a-z0-9]+/', '', $s);
        return $s;
    }

    private function catalogWorkerIds()
    {
        $keys = [];
        foreach (DB::table('unidades_organizativas')->get() as $c) {
            $keys[$this->normName($c->nombre)] = true;
        }

        $ids = [];
        foreach (Trabajador::where('activo', true)->select('id', 'unidad_organizativa')->get() as $w) {
            $key = $this->normName($w->unidad_organizativa);
            if ($key !== '' && isset($keys[$key])) {
                $ids[] = $w->id;
            }
        }
        return $ids;
    }

    private function findPosicion($cargo)
    {
        if (!$cargo) return null;

        static $map = null;
        if ($map === null) {
            $map = [];
            foreach (DB::table('posiciones')->get() as $p) {
                $map[$this->normName($p->nombre)] = $p;
            }
        }

        $key = $this->normName($cargo);
        return isset($map[$key]) ? $map[$key] : null;
    }

    private function riesgoFromPosicion($cargo)
    {
        $pos = $this->findPosicion($cargo);
        if (!$pos) return [];

        if ($pos->alto_riesgo) {
            return [
                'es_alto_riesgo' => true,
                'tipo_alto_riesgo' => $pos->tipo_alto_riesgo,
                'subcategoria_operario' => $pos->tipo_alto_riesgo === 'operario_cables' ? $pos->subcategoria : null,
                'subcategoria_chofer' => $pos->tipo_alto_riesgo === 'chofer' ? $pos->subcategoria : null,
            ];
        }

        return [
            'es_alto_riesgo' => false,
            'tipo_alto_riesgo' => null,
            'subcategoria_operario' => null,
            'subcategoria_chofer' => null,
        ];
    }
}

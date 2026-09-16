<?php

namespace App\Http\Controllers;

use App\Models\Trabajador;
use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ImportController extends Controller
{
    public function preview(Request $request)
    {
        $this->ensureEspecialistaPrincipal();

        $rows = $request->input('rows', []);

        if (empty($rows)) {
            return response()->json(['error' => 'No hay datos para importar']);
        }

        $preview = [];
        $errors = [];

        foreach ($rows as $i => $row) {
            try {
                $this->validateRow($row, false);
                $preview[] = $row;
            } catch (\Exception $e) {
                $errors[] = "Fila " . ($i + 1) . ": " . $e->getMessage();
            }
        }

        return response()->json([
            'preview' => $preview,
            'total' => count($rows),
            'validos' => count($preview),
            'errors' => $errors,
        ]);
    }

    public function execute(Request $request)
    {
        $this->ensureEspecialistaPrincipal();

        $rows = $request->input('rows', []);

        if (empty($rows)) {
            return response()->json(['error' => 'No hay datos para importar']);
        }

        $inserted = 0;
        $updated = 0;
        $fail = 0;
        $errors = [];

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                try {
                    $this->validateRow($row, false);
                    $idNum = trim($row['id_numerico'] ?? '');

                    $existing = Trabajador::where('id_numerico', $idNum)->first();

                    $data = [
                        'id_numerico' => $idNum,
                        'nombre' => trim($row['nombre'] ?? ''),
                        'fecha_nacimiento' => !empty($row['fecha_nacimiento']) ? $row['fecha_nacimiento'] : null,
                        'cargo' => trim($row['cargo'] ?? ''),
                        'unidad_organizativa' => trim($row['unidad_organizativa'] ?? '') ?: null,
                        'division_id' => !empty($row['division_id']) ? (int)$row['division_id'] : null,
                        'sexo' => isset($row['sexo']) ? (int)$row['sexo'] : 2,
                        'es_alto_riesgo' => !empty($row['es_alto_riesgo']) && ($row['es_alto_riesgo'] == '1' || $row['es_alto_riesgo'] === true),
                        'tipo_alto_riesgo' => !empty($row['tipo_alto_riesgo']) ? $row['tipo_alto_riesgo'] : null,
                        'subcategoria_operario' => !empty($row['subcategoria_operario']) ? $row['subcategoria_operario'] : null,
                        'subcategoria_chofer' => !empty($row['subcategoria_chofer']) ? $row['subcategoria_chofer'] : null,
                        'fecha_ultimo_chequeo' => !empty($row['fecha_ultimo_chequeo']) ? $row['fecha_ultimo_chequeo'] : null,
                        'embarazada' => !empty($row['embarazada']) && $row['embarazada'] == '1',
                        'periodo_maternidad_inicio' => !empty($row['periodo_maternidad_inicio']) ? $row['periodo_maternidad_inicio'] : null,
                        'periodo_maternidad_fin' => !empty($row['periodo_maternidad_fin']) ? $row['periodo_maternidad_fin'] : null,
                    ];

                    if (!empty($data['cargo'])) {
                        $pos = $this->findPosicion($data['cargo']);
                        if ($pos) {
                            if ($pos->alto_riesgo) {
                                $data['es_alto_riesgo'] = true;
                                $data['tipo_alto_riesgo'] = $pos->tipo_alto_riesgo;
                                $data['subcategoria_operario'] = $pos->tipo_alto_riesgo === 'operario_cables' ? $pos->subcategoria : null;
                                $data['subcategoria_chofer'] = $pos->tipo_alto_riesgo === 'chofer' ? $pos->subcategoria : null;
                            } else {
                                $data['es_alto_riesgo'] = false;
                                $data['tipo_alto_riesgo'] = null;
                                $data['subcategoria_operario'] = null;
                                $data['subcategoria_chofer'] = null;
                            }
                        }
                    }

                    if ($existing) {
                        $existing->update($data);
                        $updated++;
                    } else {
                        Trabajador::create($data);
                        $inserted++;
                    }
                } catch (\Exception $e) {
                    $fail++;
                    $name = $row['nombre'] ?? '?';
                    $errors[] = "$name: " . $e->getMessage();
                }
            }
            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error en la transaccion: ' . $e->getMessage()]);
        }

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'agregar',
            'descripcion' => "Importacion masiva: $inserted insertados, $updated actualizados, $fail fallidos",
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'inserted' => $inserted,
            'updated' => $updated,
            'fail' => $fail,
            'errors' => $errors,
        ]);
    }

    public function checkDuplicates(Request $request)
    {
        $this->ensureEspecialistaPrincipal();

        $idNumericos = $request->input('id_numericos', []);

        if (empty($idNumericos)) {
            return response()->json(['existing' => []]);
        }

        $existing = Trabajador::whereIn('id_numerico', $idNumericos)
            ->select('id_numerico')
            ->get()
            ->pluck('id_numerico')
            ->toArray();

        return response()->json(['existing' => $existing]);
    }

    private function validateRow($data, $isEdit = false)
    {
        $errors = [];

        if (empty($data['nombre']) || trim($data['nombre']) === '') {
            $errors[] = 'El nombre es requerido';
        } elseif (strlen(trim($data['nombre'])) > 200) {
            $errors[] = 'El nombre no puede exceder 200 caracteres';
        }

        if (empty($data['cargo']) || trim($data['cargo']) === '') {
            $errors[] = 'El cargo/posicion es requerido';
        } elseif (strlen(trim($data['cargo'])) > 150) {
            $errors[] = 'El cargo no puede exceder 150 caracteres';
        }

        if (!$isEdit && (empty($data['id_numerico']) || trim($data['id_numerico']) === '')) {
            $errors[] = 'El numero de personal es requerido';
        } elseif (!$isEdit && strlen(trim($data['id_numerico'])) > 20) {
            $errors[] = 'El numero de personal no puede exceder 20 caracteres';
        }

        if (!empty($data['fecha_nacimiento'])) {
            $fn = \DateTime::createFromFormat('Y-m-d', $data['fecha_nacimiento']);
            if (!$fn || $fn->format('Y-m-d') !== $data['fecha_nacimiento']) {
                $errors[] = 'La fecha de nacimiento no es valida';
            } elseif ($fn > new \DateTime()) {
                $errors[] = 'La fecha de nacimiento no puede ser futura';
            }
        } elseif (!$isEdit) {
            $errors[] = 'La fecha de nacimiento es requerida';
        }

        if (!empty($data['fecha_ultimo_chequeo'])) {
            $chequeo = \DateTime::createFromFormat('Y-m-d', $data['fecha_ultimo_chequeo']);
            if (!$chequeo || $chequeo->format('Y-m-d') !== $data['fecha_ultimo_chequeo']) {
                $errors[] = 'La fecha de ultimo chequeo no es valida';
            } elseif ($chequeo > new \DateTime()) {
                $errors[] = 'La fecha de ultimo chequeo no puede ser futura';
            } else {
                $diff = $chequeo->diff(new \DateTime())->days;
                if ($diff > 365) {
                    $errors[] = 'El ultimo chequeo medico debe ser menor a 1 ano natural';
                }
            }
        }

        if (isset($data['sexo']) && $data['sexo'] !== '') {
            $sexo = (int)$data['sexo'];
            if ($sexo !== 1 && $sexo !== 2) {
                $errors[] = 'El sexo debe ser 1 (Femenino) o 2 (Masculino)';
            }
        }

        if (!empty($data['unidad_organizativa']) && strlen(trim($data['unidad_organizativa'])) > 200) {
            $errors[] = 'La unidad organizativa no puede exceder 200 caracteres';
        }

        if (!empty($data['es_alto_riesgo']) && ($data['es_alto_riesgo'] == '1' || $data['es_alto_riesgo'] === true)) {
            $tiposValidos = ['chofer', 'liniero', 'torrero', 'operario_cables', 'operador_grua'];
            if (empty($data['tipo_alto_riesgo']) || !in_array($data['tipo_alto_riesgo'], $tiposValidos)) {
                $errors[] = 'Debe seleccionar un tipo de alto riesgo valido';
            }
            if (($data['tipo_alto_riesgo'] ?? '') === 'operario_cables' && empty($data['subcategoria_operario'])) {
                $errors[] = 'La subcategoria es requerida para Operario de Cables';
            }
            if (($data['tipo_alto_riesgo'] ?? '') === 'chofer' && empty($data['subcategoria_chofer'])) {
                $errors[] = 'La subcategoria es requerida para Chofer';
            }
        }

        if (!empty($errors)) {
            throw new \Exception(implode('; ', $errors));
        }
    }

    private function ensureEspecialistaPrincipal()
    {
        $user = Auth::user();
        if (!$user || ($user->role !== 'admin' && $user->username !== 'especialista_principal')) {
            abort(403, 'Solo el Especialista Principal puede importar datos');
        }
    }

    private function normName($s)
    {
        $s = mb_strtolower(trim((string) $s));
        $s = str_replace(["“", "”", "‘", "’", '"', "'"], '', $s);
        $s = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $s);
        $s = preg_replace('/[^a-z0-9]+/', '', $s);
        return $s;
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
}

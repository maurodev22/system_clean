<?php

namespace App\Http\Controllers;

use App\Models\Auditoria;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ExportController extends Controller
{
    public function export(Request $request, $format, $type)
    {
        $altoriesgo = $request->get('altoriesgo', '');
        $filterAccion = $request->get('accion', '');
        $filterUsuario = $request->get('usuario', '');
        $filterFecha = $request->get('fecha', '');
        $idsRaw = $request->get('ids', '');

        $ids = [];
        if ($idsRaw !== '') {
            $ids = array_values(array_filter(array_map('intval', explode(',', $idsRaw))));
        }

        if ($type === 'auditoria' && !Auth::user()->isAdmin()) {
            abort(403, 'Acceso denegado');
        }

        Auditoria::create([
            'usuario' => Auth::user()->username,
            'accion' => 'exportar',
            'descripcion' => "Exportacion $type en formato $format" . (count($ids) ? " (" . count($ids) . " seleccionados)" : ''),
            'ip_address' => $request->ip(),
        ]);

        if ($format === 'excel') {
            return $this->exportCSV($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids);
        }

        return $this->exportPDF($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids);
    }

    private function getData($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids = [])
    {
        switch ($type) {
            case 'auditoria':
                $where = [];
                $params = [];
                if ($filterAccion) {
                    $where[] = "a.accion = ?";
                    $params[] = $filterAccion;
                }
                if ($filterUsuario) {
                    $where[] = "LOWER(a.usuario) LIKE ?";
                    $params[] = '%' . strtolower($filterUsuario) . '%';
                }
                if ($filterFecha) {
                    $where[] = "a.fecha_hora::DATE = ?";
                    $params[] = $filterFecha;
                }
                $whereSql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
                return DB::select("
                    SELECT a.id, a.usuario, a.accion, a.descripcion,
                           t.nombre as trabajador, a.ip_address,
                           TO_CHAR(a.fecha_hora, 'DD/MM/YYYY HH24:MI:SS') as fecha_hora
                    FROM auditoria a LEFT JOIN trabajadores t ON a.trabajador_id = t.id
                    $whereSql
                    ORDER BY a.fecha_hora DESC LIMIT 1000
                ", $params);

            case 'donantes':
                return DB::select("
                    SELECT t.id_numerico, t.nombre, d.tipo_sangre,
                           TO_CHAR(d.fecha_donacion,'DD/MM/YYYY') as fecha_donacion,
                           TO_CHAR(d.fecha_donacion + INTERVAL '3 months','DD/MM/YYYY') as proxima_donacion,
                           CASE WHEN (d.fecha_donacion + INTERVAL '3 months')::DATE <= CURRENT_DATE
                                THEN 'Si' ELSE 'No' END as puede_donar,
                           CASE WHEN d.recibio_estimulo THEN 'Si' ELSE 'No' END as estimulo,
                           t.cargo, d.observaciones
                    FROM donaciones_sangre d
                    JOIN trabajadores t ON d.trabajador_id = t.id
                    ORDER BY d.fecha_donacion DESC
                ");

            case 'choferes':
                return DB::select("
                    SELECT t.id_numerico, t.nombre,
                           TO_CHAR(t.fecha_nacimiento,'DD/MM/YYYY') as nacimiento,
                           t.cargo, t.unidad_organizativa, div.nombre as division,
                           TO_CHAR(t.fecha_ultimo_chequeo,'DD/MM/YYYY') as ultimo_chequeo,
                           TO_CHAR(t.fecha_recalificacion,'DD/MM/YYYY') as recalificacion,
                           TO_CHAR(t.fecha_examen_psicofisiologico,'DD/MM/YYYY') as psicofisiologico,
                           TO_CHAR(t.fecha_chequeo_especializado,'DD/MM/YYYY') as chequeo_especializado,
                           TO_CHAR(t.fecha_chequeo_chofer,'DD/MM/YYYY') as chequeo_chofer
                    FROM trabajadores t LEFT JOIN divisiones div ON t.division_id = div.id
                    WHERE t.tipo_alto_riesgo = 'chofer' AND t.activo = TRUE
                    ORDER BY t.nombre
                ");

            default: // trabajadores
                $where = "t.activo = TRUE";
                $params = [];
                if ($altoriesgo) {
                    $where .= " AND t.tipo_alto_riesgo = ? AND t.es_alto_riesgo = TRUE";
                    $params[] = $altoriesgo;
                }
                if (count($ids)) {
                    $placeholders = implode(',', array_fill(0, count($ids), '?'));
                    $where .= " AND t.id IN ($placeholders)";
                    foreach ($ids as $id) {
                        $params[] = $id;
                    }
                }
                return DB::select("
                    SELECT t.id_numerico, t.nombre,
                           TO_CHAR(t.fecha_nacimiento,'DD/MM/YYYY') as nacimiento,
                           t.cargo, t.unidad_organizativa, div.nombre as division,
                           CASE WHEN t.sexo=1 THEN 'Mujer' ELSE 'Hombre' END as sexo,
                           CASE WHEN t.es_alto_riesgo THEN 'Si' ELSE 'No' END as alto_riesgo,
                           COALESCE(t.tipo_alto_riesgo, '-') as tipo_riesgo,
                           TO_CHAR(t.fecha_ultimo_chequeo,'DD/MM/YYYY') as ultimo_chequeo,
                           STRING_AGG(e.nombre, ', ') as enfermedades
                    FROM trabajadores t
                    LEFT JOIN divisiones div ON t.division_id = div.id
                    LEFT JOIN trabajador_enfermedades te ON t.id = te.trabajador_id
                    LEFT JOIN enfermedades e ON te.enfermedad_id = e.id
                    WHERE $where
                    GROUP BY t.id, t.id_numerico, t.nombre, t.fecha_nacimiento,
                             t.cargo, t.unidad_organizativa, div.nombre,
                             t.sexo, t.es_alto_riesgo, t.tipo_alto_riesgo, t.fecha_ultimo_chequeo
                    ORDER BY t.nombre
                ", $params);
        }
    }

    private function exportCSV($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids = [])
    {
        $data = $this->getData($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids);

        $titulos = [
            'trabajadores' => 'Listado de Trabajadores',
            'donantes' => 'Donantes de Sangre',
            'choferes' => 'Listado de Choferes - Alto Riesgo',
            'auditoria' => 'Registro de Auditoria',
        ];
        $titles = [
            'trabajadores' => 'trabajadores',
            'donantes' => 'donantes_sangre',
            'choferes' => 'choferes',
            'auditoria' => 'auditoria',
        ];
        $titleLabel = $titulos[$type] ?? ucfirst($type);
        $filename = ($titles[$type] ?? $type) . '_' . date('Ymd_His') . '.xls';

        $headers = !empty($data) ? array_keys((array)$data[0]) : [];

        $response = '<html xmlns:o="urn:schemas-microsoft-com:office:office"
              xmlns:x="urn:schemas-microsoft-com:office:excel"
              xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Datos</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <style>
            table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 11px; }
            th { background-color: #003087; color: #ffffff; padding: 8px 10px; text-align: left; font-weight: bold; border: 1px solid #003087; }
            td { padding: 6px 10px; border: 1px solid #d0d0d0; }
        </style></head><body>
        <table>
            <tr><th colspan="' . count($headers) . '">ETECSA &mdash; ' . htmlspecialchars($titleLabel) . '</th></tr>
            <tr><td colspan="' . count($headers) . '" style="font-size:11px;color:#555;text-align:center">Division Pinar del Rio &middot; Generado: ' . date('d/m/Y H:i:s') . '</td></tr>';

        if (!empty($data)) {
            $response .= '<tr>';
            foreach ($headers as $col) {
                $response .= '<th>' . htmlspecialchars(ucwords(str_replace('_', ' ', $col))) . '</th>';
            }
            $response .= '</tr>';

            foreach ($data as $i => $row) {
                $row = (array) $row;
                $response .= '<tr class="' . ($i % 2 == 0 ? 'row0' : 'row1') . '">';
                foreach ($row as $val) {
                    $response .= '<td>' . htmlspecialchars($val !== null ? $val : '-') . '</td>';
                }
                $response .= '</tr>';
            }
        } else {
            $response .= '<tr><td colspan="' . count($headers) . '" style="text-align:center;padding:20px;color:#888">No hay datos para mostrar.</td></tr>';
        }

        $response .= '</table></body></html>';

        return response($response, 200, [
            'Content-Type' => 'application/vnd.ms-excel; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    private function exportPDF($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids = [])
    {
        $data = $this->getData($type, $altoriesgo, $filterAccion, $filterUsuario, $filterFecha, $ids);

        $titulos = [
            'trabajadores' => 'Listado de Trabajadores',
            'donantes' => 'Donantes de Sangre',
            'choferes' => 'Listado de Choferes - Alto Riesgo',
            'auditoria' => 'Registro de Auditoria',
        ];
        $title = $titulos[$type] ?? ucfirst($type);

        $pdf = new \FPDF();
        $pdf->SetMargins(10, 10, 10);
        $pdf->AddPage();
        $pdf->SetFont('Helvetica', 'B', 10);
        $pdf->SetTextColor(0, 48, 135);
        $pdf->Cell(0, 6, 'ETECSA - Empresa de Telecomunicaciones de Cuba', 0, 1, 'C');
        $pdf->SetFont('Helvetica', '', 8);
        $pdf->SetTextColor(85, 85, 85);
        $pdf->Cell(0, 5, iconv('UTF-8', 'ISO-8859-1', $title), 0, 1, 'C');
        $pdf->Cell(0, 5, 'Division Pinar del Rio - Generado el: ' . date('d/m/Y H:i:s'), 0, 1, 'C');
        $pdf->Ln(4);

        $headers = !empty($data) ? array_keys((array)$data[0]) : [];

        if (empty($data)) {
            $pdf->SetFont('Helvetica', '', 10);
            $pdf->SetTextColor(85, 85, 85);
            $pdf->Cell(0, 10, iconv('UTF-8', 'ISO-8859-1', 'No hay datos para mostrar.'), 0, 1, 'C');
        } else {
            $pageW = 190;
            $colW = min(45, max(18, floor($pageW / count($headers))));

            $pdf->SetFont('Helvetica', 'B', 7);
            $pdf->SetFillColor(0, 48, 135);
            $pdf->SetTextColor(255, 255, 255);
            foreach ($headers as $h) {
                $label = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', ucwords(str_replace('_', ' ', $h)));
                $pdf->Cell($colW, 7, $label, 1, 0, 'C', true);
            }
            $pdf->Ln();

            $pdf->SetFont('Helvetica', '', 6.5);
            $pdf->SetTextColor(26, 26, 26);
            $fill = false;
            foreach ($data as $row) {
                $row = (array) $row;
                $rowH = 7;
                if ($pdf->GetY() + $rowH > 265) $pdf->AddPage();

                $pdf->SetFillColor($fill ? 240 : 255, $fill ? 245 : 255, $fill ? 255 : 255);
                foreach ($row as $val) {
                    $txt = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', ($val !== null && $val !== '' ? $val : '-'));
                    $pdf->Cell($colW, $rowH, $txt, 1, 0, 'L', true);
                }
                $pdf->Ln();
                $fill = !$fill;
            }
        }

        $titles = [
            'trabajadores' => 'trabajadores',
            'donantes' => 'donantes_sangre',
            'choferes' => 'choferes',
            'auditoria' => 'auditoria',
        ];
        $filename = ($titles[$type] ?? $type) . '_' . date('Ymd_His') . '.pdf';

        return response($pdf->Output('S', $filename), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }
}

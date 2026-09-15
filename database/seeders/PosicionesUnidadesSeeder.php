<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PosicionesUnidadesSeeder extends Seeder
{    public function run()
    {
        // Datos de ejemplo ficticios para la version publica

        $unidades = [
            'ALMACEN GENERAL',
            'CENTRO DE ATENCION CLIENTES',
            'CENTRO DE OPERACIONES',
            'CENTRO DE DIRECCION',
            'DEPARTAMENTO DE ECONOMIA',
            'DEPARTAMENTO DE LOGISTICA',
            'DEPARTAMENTO DE CAPITAL HUMANO',
            'DEPARTAMENTO COMERCIAL',
            'DEPARTAMENTO DE INVERSIONES',
            'DEPARTAMENTO DE TECNOLOGIA',
            'GRUPO DE CONTABILIDAD',
            'GRUPO DE FINANZAS',
            'GRUPO DE MARKETING',
            'GRUPO DE SERVICIOS GENERALES',
            'GRUPO DE TRANSPORTE',
            'OFICINA CENTRAL',
            'OFICINA COMERCIAL NORTE',
            'OFICINA COMERCIAL CENTRO',
            'OFICINA COMERCIAL SUR',
            'PLANTA EXTERIOR',
            'PLANTA INTERIOR',
            'RED DE ABONADOS',
            'SOPORTE INFORMATICO',
            'TALLER DE REPARACIONES',
            'TALLER DE TRANSPORTE',
            'UNIDAD DE CONTROL',
            'UNIDAD DE SUPERVISION',
            'UNIDAD OPERATIVA',
        ];

        $posiciones = [
            ['nombre' => 'ACONDICIONADOR DE REGISTROS', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'AUXILIAR DE LIMPIEZA', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'AUXILIAR GENERAL DE SERVICIOS', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'AUXILIAR TECNICO', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'AYUDANTE', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'CHOFER "B"', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'chofer', 'subcategoria' => 'B'],
            ['nombre' => 'CHOFER "C"', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'chofer', 'subcategoria' => 'C'],
            ['nombre' => 'CHOFER "D"', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'chofer', 'subcategoria' => 'D'],
            ['nombre' => 'DESPACHADOR DE ORDENES', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'DIRECTOR GENERAL', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'EJECUTIVO DE CUENTAS', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'EJECUTIVO DE FACTURACION', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'EJECUTIVO DE PUNTO DE VENTA', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'ELECTRICISTA "A" AUTOMOTOR', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'ENCARGADO DE ALMACEN "C"', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'GESTOR DE SERVICIOS', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'JEFE DE CENTRO', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'JEFE DE DEPARTAMENTO "B"', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'JEFE DE GRUPO', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'JEFE DE TALLER', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'JEFE DE UNIDAD', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'MECANICO "A" AUTOMOTOR', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'OPERADOR DE MAQUINARIA PESADA', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'operador_grua', 'subcategoria' => null],
            ['nombre' => 'OPERADOR GENERAL DE MANTENIMIENTO', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'OPERARIO DE LINEAS', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'liniero', 'subcategoria' => 'A'],
            ['nombre' => 'OPERARIO DE REDES DE CABLE', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'operario_cables', 'subcategoria' => 'B'],
            ['nombre' => 'OPERARIO TECNICO', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'PROBADOR DE CABLE', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'operario_cables', 'subcategoria' => null],
            ['nombre' => 'RECEPCIONISTA', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'SECRETARIA EJECUTIVA "B"', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'SOLDADOR "A"', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'SUPERVISOR DE PLANTA EXTERIOR', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'SUPERVISOR DE PLANTA INTERIOR', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'TECNICO EN GESTION COMERCIAL', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'TECNICO EN GESTION ECONOMICA', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'TECNICO EN RECURSOS HUMANOS', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'TECNICO EN CIENCIAS INFORMATICAS', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'TECNICO DE SOPORTE TECNICO', 'alto_riesgo' => false, 'tipo_alto_riesgo' => null, 'subcategoria' => null],
            ['nombre' => 'TORRERO "A"', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'torrero', 'subcategoria' => 'A'],
            ['nombre' => 'TORRERO "B"', 'alto_riesgo' => true, 'tipo_alto_riesgo' => 'torrero', 'subcategoria' => 'B'],
        ];

        foreach ($unidades as $nombre) {
            DB::table('unidades_organizativas')->updateOrInsert(
                ['nombre' => $nombre],
                ['nombre' => $nombre, 'updated_at' => now()]
            );
        }

        foreach ($posiciones as $p) {
            DB::table('posiciones')->updateOrInsert(
                ['nombre' => $p['nombre']],
                $p + ['updated_at' => now()]
            );
        }
    }
}
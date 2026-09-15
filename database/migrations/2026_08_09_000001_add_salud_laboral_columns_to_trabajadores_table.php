<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSaludLaboralColumnsToTrabajadoresTable extends Migration
{
    public function up()
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->date('fecha_chequeo_chofer')->nullable()->after('fecha_chequeo_especializado');
            $table->date('fecha_gestacion_inicio')->nullable()->after('periodo_maternidad_fin');
            $table->string('maternidad_estado_manual', 20)->nullable()->after('fecha_gestacion_inicio');
        });
    }

    public function down()
    {
        Schema::table('trabajadores', function (Blueprint $table) {
            $table->dropColumn(['fecha_chequeo_chofer', 'fecha_gestacion_inicio', 'maternidad_estado_manual']);
        });
    }
}

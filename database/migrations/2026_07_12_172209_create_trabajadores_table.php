<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTrabajadoresTable extends Migration
{
    public function up()
    {
        Schema::create('trabajadores', function (Blueprint $table) {
            $table->id();
            $table->string('id_numerico', 20)->unique();
            $table->string('nombre', 200);
            $table->date('fecha_nacimiento');
            $table->string('cargo', 150);
            $table->string('unidad_organizativa', 200)->nullable();
            $table->unsignedBigInteger('division_id')->nullable();
            $table->foreign('division_id')->references('id')->on('divisiones')->onDelete('set null');
            $table->integer('sexo');
            $table->boolean('es_alto_riesgo')->default(false);
            $table->string('tipo_alto_riesgo', 50)->nullable();
            $table->string('subcategoria_operario', 5)->nullable();
            $table->string('subcategoria_chofer', 10)->nullable();
            $table->date('fecha_ultimo_chequeo')->nullable();
            $table->boolean('embarazada')->default(false);
            $table->date('periodo_maternidad_inicio')->nullable();
            $table->date('periodo_maternidad_fin')->nullable();
            $table->date('fecha_recalificacion')->nullable();
            $table->date('fecha_examen_psicofisiologico')->nullable();
            $table->date('fecha_chequeo_especializado')->nullable();
            $table->string('tipo_sangre', 5)->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('trabajadores');
    }
}

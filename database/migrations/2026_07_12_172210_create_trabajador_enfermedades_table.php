<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTrabajadorEnfermedadesTable extends Migration
{
    public function up()
    {
        Schema::create('trabajador_enfermedades', function (Blueprint $table) {
            $table->unsignedBigInteger('trabajador_id');
            $table->unsignedBigInteger('enfermedad_id');
            $table->primary(['trabajador_id', 'enfermedad_id']);
            $table->foreign('trabajador_id')->references('id')->on('trabajadores')->onDelete('cascade');
            $table->foreign('enfermedad_id')->references('id')->on('enfermedades')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('trabajador_enfermedades');
    }
}

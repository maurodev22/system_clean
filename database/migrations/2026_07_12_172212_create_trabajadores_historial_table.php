<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateTrabajadoresHistorialTable extends Migration
{
    public function up()
    {
        Schema::create('trabajadores_historial', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('trabajador_id');
            $table->foreign('trabajador_id')->references('id')->on('trabajadores')->onDelete('cascade');
            $table->json('snapshot_data');
            $table->text('enfermedades_nombres')->nullable();
            $table->string('modificado_por', 100)->nullable();
            $table->timestamp('modificado_en')->useCurrent();

            $table->index('trabajador_id');
            $table->index(['trabajador_id', 'modificado_en']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('trabajadores_historial');
    }
}

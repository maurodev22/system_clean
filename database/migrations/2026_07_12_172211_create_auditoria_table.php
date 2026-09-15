<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAuditoriaTable extends Migration
{
    public function up()
    {
        Schema::create('auditoria', function (Blueprint $table) {
            $table->id();
            $table->string('usuario', 100);
            $table->string('accion', 50);
            $table->text('descripcion')->nullable();
            $table->unsignedBigInteger('trabajador_id')->nullable();
            $table->foreign('trabajador_id')->references('id')->on('trabajadores')->onDelete('set null');
            $table->string('ip_address', 50)->nullable();
            $table->timestamp('fecha_hora')->useCurrent();

            $table->index('usuario');
            $table->index('fecha_hora');
        });
    }

    public function down()
    {
        Schema::dropIfExists('auditoria');
    }
}

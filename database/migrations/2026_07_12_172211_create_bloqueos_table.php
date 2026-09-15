<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBloqueosTable extends Migration
{
    public function up()
    {
        Schema::create('bloqueos', function (Blueprint $table) {
            $table->id();
            $table->string('recurso_tipo', 20);
            $table->integer('recurso_id');
            $table->string('usuario', 100);
            $table->string('sesion_id', 100);
            $table->timestamp('fecha_inicio')->useCurrent();
            $table->timestamp('fecha_expiracion');
            $table->boolean('activo')->default(true);

            $table->index(['recurso_tipo', 'recurso_id', 'activo']);
            $table->index('sesion_id');
        });
    }

    public function down()
    {
        Schema::dropIfExists('bloqueos');
    }
}

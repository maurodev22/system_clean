<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUnidadesYPosicionesTables extends Migration
{
    public function up()
    {
        Schema::create('unidades_organizativas', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 250)->unique();
            $table->timestamps();
        });

        Schema::create('posiciones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 250)->unique();
            $table->boolean('alto_riesgo')->default(false);
            $table->string('tipo_alto_riesgo', 50)->nullable();
            $table->string('subcategoria', 5)->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('posiciones');
        Schema::dropIfExists('unidades_organizativas');
    }
}

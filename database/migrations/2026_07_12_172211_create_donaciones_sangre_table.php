<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDonacionesSangreTable extends Migration
{
    public function up()
    {
        Schema::create('donaciones_sangre', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('trabajador_id');
            $table->foreign('trabajador_id')->references('id')->on('trabajadores')->onDelete('cascade');
            $table->date('fecha_donacion');
            $table->string('tipo_sangre', 5);
            $table->boolean('recibio_estimulo')->default(false);
            $table->text('observaciones')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down()
    {
        Schema::dropIfExists('donaciones_sangre');
    }
}

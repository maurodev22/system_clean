<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDivisionesTable extends Migration
{
    public function up()
    {
        Schema::create('divisiones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->unsignedBigInteger('parent_id')->nullable();
            $table->foreign('parent_id')->references('id')->on('divisiones')->onDelete('set null');
        });
    }

    public function down()
    {
        Schema::dropIfExists('divisiones');
    }
}

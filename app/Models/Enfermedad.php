<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Enfermedad extends Model
{
    protected $table = 'enfermedades';
    protected $fillable = ['nombre'];
    public $timestamps = false;

    public function trabajadores()
    {
        return $this->belongsToMany(Trabajador::class, 'trabajador_enfermedades');
    }
}

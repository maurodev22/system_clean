<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bloqueo extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'recurso_tipo', 'recurso_id', 'usuario',
        'sesion_id', 'fecha_expiracion', 'activo'
    ];

    protected $dates = ['fecha_inicio', 'fecha_expiracion'];
}

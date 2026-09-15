<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Auditoria extends Model
{
    protected $table = 'auditoria';
    public $timestamps = false;

    protected $fillable = [
        'usuario', 'accion', 'descripcion',
        'trabajador_id', 'ip_address', 'fecha_hora'
    ];

    protected $dates = ['fecha_hora'];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Donacion extends Model
{
    protected $table = 'donaciones_sangre';
    public $timestamps = false;

    protected $fillable = [
        'trabajador_id', 'fecha_donacion', 'tipo_sangre',
        'recibio_estimulo', 'observaciones'
    ];

    protected $dates = ['fecha_donacion', 'created_at'];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class);
    }
}

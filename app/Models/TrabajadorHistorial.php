<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrabajadorHistorial extends Model
{
    protected $table = 'trabajadores_historial';
    public $timestamps = false;

    protected $fillable = [
        'trabajador_id', 'snapshot_data', 'enfermedades_nombres',
        'modificado_por', 'modificado_en'
    ];

    protected $casts = [
        'snapshot_data' => 'array'
    ];

    protected $dates = ['modificado_en'];

    public function trabajador()
    {
        return $this->belongsTo(Trabajador::class);
    }
}

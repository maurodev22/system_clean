<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Trabajador extends Model
{
    protected $table = 'trabajadores';

    protected $fillable = [
        'id_numerico', 'nombre', 'fecha_nacimiento', 'cargo',
        'unidad_organizativa', 'division_id', 'sexo',
        'es_alto_riesgo', 'tipo_alto_riesgo',
        'subcategoria_operario', 'subcategoria_chofer',
        'fecha_ultimo_chequeo', 'embarazada',
        'periodo_maternidad_inicio', 'periodo_maternidad_fin',
        'fecha_recalificacion', 'fecha_examen_psicofisiologico',
        'fecha_chequeo_especializado', 'tipo_sangre', 'activo',
        'fecha_chequeo_chofer', 'fecha_gestacion_inicio', 'maternidad_estado_manual'
    ];

    protected $dates = [
        'fecha_nacimiento', 'fecha_ultimo_chequeo',
        'periodo_maternidad_inicio', 'periodo_maternidad_fin',
        'fecha_recalificacion', 'fecha_examen_psicofisiologico',
        'fecha_chequeo_especializado', 'fecha_chequeo_chofer',
        'fecha_gestacion_inicio'
    ];

    public function division()
    {
        return $this->belongsTo(Division::class);
    }

    public function enfermedades()
    {
        return $this->belongsToMany(Enfermedad::class, 'trabajador_enfermedades', 'trabajador_id', 'enfermedad_id');
    }

    public function donaciones()
    {
        return $this->hasMany(Donacion::class, 'trabajador_id');
    }

    public function historiales()
    {
        return $this->hasMany(TrabajadorHistorial::class, 'trabajador_id');
    }

    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    public function scopeAltoRiesgo($query)
    {
        return $query->where('es_alto_riesgo', true);
    }

    public function scopeChoferes($query)
    {
        return $query->where('tipo_alto_riesgo', 'chofer');
    }

    public function scopeByDivision($query, $divisionId)
    {
        return $query->where('division_id', $divisionId);
    }
}

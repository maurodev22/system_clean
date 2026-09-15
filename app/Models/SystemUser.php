<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;

class SystemUser extends Authenticatable
{
    protected $table = 'system_users';

    protected $fillable = [
        'username', 'role', 'full_name', 'activo',
        'password_hash', 'ultimo_acceso', 'password_changed_at'
    ];

    protected $hidden = ['password_hash'];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function isAdmin()
    {
        return $this->role === 'admin';
    }

    public function isEspecialista()
    {
        return $this->role === 'especialista';
    }
}

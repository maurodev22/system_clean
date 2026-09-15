<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        DB::table('system_users')->insert([
            [
                'username' => 'admin',
                'password_hash' => Hash::make('admin123'),
                'role' => 'admin',
                'full_name' => 'Administrador Sistema',
                'activo' => true,
            ],
            [
                'username' => 'Especialista',
                'password_hash' => Hash::make('Especialista123'),
                'role' => 'especialista',
                'full_name' => 'Especialista de Division',
                'activo' => true,
            ],
            [
                'username' => 'Especialista Principal',
                'password_hash' => Hash::make('EspecialistaPrincipal123'),
                'role' => 'especialista',
                'full_name' => 'Especialista Principal',
                'activo' => true,
            ],
        ]);
    }
}

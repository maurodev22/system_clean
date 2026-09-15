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
                'password_hash' => Hash::make('password'),
                'role' => 'admin',
                'full_name' => 'Administrador Sistema',
                'activo' => true,
            ],
            [
                'username' => 'especialista',
                'password_hash' => Hash::make('password'),
                'role' => 'especialista',
                'full_name' => 'Especialista de Division',
                'activo' => true,
            ],
            [
                'username' => 'especialista_principal',
                'password_hash' => Hash::make('password'),
                'role' => 'especialista',
                'full_name' => 'Especialista Principal',
                'activo' => true,
            ],
        ]);
    }
}

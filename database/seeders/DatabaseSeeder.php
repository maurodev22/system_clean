<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            DivisionSeeder::class,
            EnfermedadSeeder::class,
            UserSeeder::class,
            PosicionesUnidadesSeeder::class,
        ]);
    }
}

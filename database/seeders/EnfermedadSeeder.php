<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EnfermedadSeeder extends Seeder
{
    public function run()
    {
        DB::table('enfermedades')->insert([
            ['nombre' => 'Diabetes'],
            ['nombre' => 'Asma'],
            ['nombre' => 'Alergias'],
            ['nombre' => 'Esquizofrenia'],
            ['nombre' => 'Hipertension'],
            ['nombre' => 'Cardiopatias'],
            ['nombre' => 'Epilepsia'],
            ['nombre' => 'Obesidad'],
            ['nombre' => 'Artritis'],
            ['nombre' => 'Insuficiencia Renal'],
            ['nombre' => 'Hepatitis'],
            ['nombre' => 'Anemia'],
            ['nombre' => 'Depresion'],
            ['nombre' => 'Ansiedad'],
            ['nombre' => 'Hipotiroidismo'],
        ]);
    }
}

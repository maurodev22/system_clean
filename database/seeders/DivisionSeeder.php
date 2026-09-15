<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DivisionSeeder extends Seeder
{
    public function run()
    {
        DB::table('divisiones')->insert([
            ['nombre' => 'Pinar del Río', 'parent_id' => null],
            ['nombre' => 'Consolación', 'parent_id' => null],
            ['nombre' => 'Guane', 'parent_id' => null],
        ]);

        DB::table('divisiones')->insert([
            ['nombre' => 'San Juan', 'parent_id' => 1],
            ['nombre' => 'San Luis', 'parent_id' => 1],
            ['nombre' => 'Minas y Viñales', 'parent_id' => 1],
        ]);

        DB::table('divisiones')->insert([
            ['nombre' => 'Los Palacios', 'parent_id' => 2],
            ['nombre' => 'La Palma', 'parent_id' => 2],
        ]);

        DB::table('divisiones')->insert([
            ['nombre' => 'Mantua', 'parent_id' => 3],
            ['nombre' => 'Sandino', 'parent_id' => 3],
        ]);
    }
}

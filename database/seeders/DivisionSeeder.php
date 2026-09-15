<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DivisionSeeder extends Seeder
{
    public function run()
    {
        DB::table('divisiones')->insert([
            ['nombre' => 'Division Norte', 'parent_id' => null],
            ['nombre' => 'Division Centro', 'parent_id' => null],
            ['nombre' => 'Division Sur', 'parent_id' => null],
        ]);

        DB::table('divisiones')->insert([
            ['nombre' => 'Unidad Norte A', 'parent_id' => 1],
            ['nombre' => 'Unidad Norte B', 'parent_id' => 1],
            ['nombre' => 'Unidad Norte C', 'parent_id' => 1],
        ]);

        DB::table('divisiones')->insert([
            ['nombre' => 'Unidad Centro A', 'parent_id' => 2],
            ['nombre' => 'Unidad Centro B', 'parent_id' => 2],
        ]);

        DB::table('divisiones')->insert([
            ['nombre' => 'Unidad Sur A', 'parent_id' => 3],
            ['nombre' => 'Unidad Sur B', 'parent_id' => 3],
        ]);
    }
}
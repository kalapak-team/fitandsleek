<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            // Parent Categories for Homepage
            ['name' => 'Clothes', 'type' => 'parent'],
            ['name' => 'Shoes', 'type' => 'parent'],
            ['name' => 'Belts', 'type' => 'parent'],

            // MEN
            ['name' => 'Men - T-Shirts', 'gender' => 'MEN'],
            ['name' => 'Men - Shirts', 'gender' => 'MEN'],
            ['name' => 'Men - Pants', 'gender' => 'MEN'],
            ['name' => 'Men - Shoes', 'gender' => 'MEN'],

            // WOMEN
            ['name' => 'Women - Dresses', 'gender' => 'WOMEN'],
            ['name' => 'Women - Tops', 'gender' => 'WOMEN'],
            ['name' => 'Women - Skirts', 'gender' => 'WOMEN'],
            ['name' => 'Women - Shoes', 'gender' => 'WOMEN'],

            // BOY
            ['name' => 'Boy - T-Shirts', 'gender' => 'BOY'],
            ['name' => 'Boy - Shorts', 'gender' => 'BOY'],
            ['name' => 'Boy - Shoes', 'gender' => 'BOY'],

            // GIRL
            ['name' => 'Girl - Dresses', 'gender' => 'GIRL'],
            ['name' => 'Girl - Tops', 'gender' => 'GIRL'],
            ['name' => 'Girl - Shoes', 'gender' => 'GIRL'],
        ];

        foreach ($data as $row) {
            Category::updateOrCreate(
                ['slug' => Str::slug($row['name'])],
                [
                    'name' => $row['name'],
                    'type' => $row['type'] ?? null,
                    'gender' => $row['gender'] ?? null,
                    'is_active' => true,
                ]
            );
        }
    }
}

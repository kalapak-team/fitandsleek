<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SuperAdminSeeder::class,
            CoreSeeder::class,
            FooterHeaderSeeder::class,
            AdminUserSeeder::class,
            CategorySeeder::class,
            ProductSeeder::class,
            SaleSeeder::class,
            CustomerSeeder::class,
            HomepageSeeder::class,
        ]);
    }
}

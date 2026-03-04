<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        // Adjust fields depending on your users table:
        // - if you have 'role' column -> set role=admin
        // - if you have 'is_admin' -> set true
        User::updateOrCreate(
            ['email' => 'admin@fitandsleekpro.com'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin12345'),
                'role' => 'admin',
            ]
        );
    }
}

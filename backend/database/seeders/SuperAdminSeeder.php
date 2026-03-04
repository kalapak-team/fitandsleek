<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        // Create Superadmin
        User::firstOrCreate(
            ['email' => 'superadmin@fitandsleek.com'],
            [
                'name' => 'Super Administrator',
                'password' => Hash::make('SuperAdmin@123'),
                'role' => 'superadmin',
                'status' => 'active',
                'phone' => '+1234567890',
            ]
        );

        // Create default Admin
        User::firstOrCreate(
            ['email' => 'admin@fitandsleek.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('Admin@123'),
                'role' => 'admin',
                'status' => 'active',
                'phone' => '+1234567891',
            ]
        );

        // Create default Customer for testing
        User::firstOrCreate(
            ['email' => 'customer@fitandsleek.com'],
            [
                'name' => 'Test Customer',
                'password' => Hash::make('Customer@123'),
                'role' => 'customer',
                'status' => 'active',
                'phone' => '+1234567892',
            ]
        );

        echo "Superadmin and default roles created successfully!\n";
    }
}

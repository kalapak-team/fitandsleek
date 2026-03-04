<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            [
                'name' => 'John Smith',
                'email' => 'john.smith@email.com',
                'phone' => '+1-555-0101',
                'address' => json_encode([
                    'street' => '123 Main Street',
                    'city' => 'New York',
                    'state' => 'NY',
                    'zip' => '10001',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(5),
            ],
            [
                'name' => 'Emily Johnson',
                'email' => 'emily.j@email.com',
                'phone' => '+1-555-0102',
                'address' => json_encode([
                    'street' => '456 Oak Avenue',
                    'city' => 'Los Angeles',
                    'state' => 'CA',
                    'zip' => '90001',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(10),
            ],
            [
                'name' => 'Michael Williams',
                'email' => 'michael.w@email.com',
                'phone' => '+1-555-0103',
                'address' => json_encode([
                    'street' => '789 Pine Road',
                    'city' => 'Chicago',
                    'state' => 'IL',
                    'zip' => '60601',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(15),
            ],
            [
                'name' => 'Sarah Brown',
                'email' => 'sarah.brown@email.com',
                'phone' => '+1-555-0104',
                'address' => json_encode([
                    'street' => '321 Elm Street',
                    'city' => 'Houston',
                    'state' => 'TX',
                    'zip' => '77001',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(20),
            ],
            [
                'name' => 'David Davis',
                'email' => 'david.d@email.com',
                'phone' => '+1-555-0105',
                'address' => json_encode([
                    'street' => '654 Maple Lane',
                    'city' => 'Phoenix',
                    'state' => 'AZ',
                    'zip' => '85001',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(25),
            ],
            [
                'name' => 'Jessica Miller',
                'email' => 'jessica.m@email.com',
                'phone' => '+1-555-0106',
                'address' => json_encode([
                    'street' => '987 Cedar Drive',
                    'city' => 'Philadelphia',
                    'state' => 'PA',
                    'zip' => '19101',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(30),
            ],
            [
                'name' => 'Christopher Wilson',
                'email' => 'chris.w@email.com',
                'phone' => '+1-555-0107',
                'address' => json_encode([
                    'street' => '147 Birch Way',
                    'city' => 'San Antonio',
                    'state' => 'TX',
                    'zip' => '78201',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(45),
            ],
            [
                'name' => 'Amanda Taylor',
                'email' => 'amanda.t@email.com',
                'phone' => '+1-555-0108',
                'address' => json_encode([
                    'street' => '258 Willow Court',
                    'city' => 'San Diego',
                    'state' => 'CA',
                    'zip' => '92101',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(60),
            ],
            [
                'name' => 'James Anderson',
                'email' => 'james.a@email.com',
                'phone' => '+1-555-0109',
                'address' => json_encode([
                    'street' => '369 Spruce Boulevard',
                    'city' => 'Dallas',
                    'state' => 'TX',
                    'zip' => '75201',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(90),
            ],
            [
                'name' => 'Ashley Thomas',
                'email' => 'ashley.t@email.com',
                'phone' => '+1-555-0110',
                'address' => json_encode([
                    'street' => '741 Redwood Path',
                    'city' => 'San Jose',
                    'state' => 'CA',
                    'zip' => '95101',
                    'country' => 'USA'
                ]),
                'created_at' => now()->subDays(120),
            ],
        ];

        foreach ($customers as $customer) {
            User::updateOrCreate(
                ['email' => $customer['email']],
                [
                    'name' => $customer['name'],
                    'email' => $customer['email'],
                    'phone' => $customer['phone'],
                    'address' => $customer['address'],
                    'password' => Hash::make('password123'),
                    'role' => 'customer',
                    'remember_token' => Str::random(10),
                    'created_at' => $customer['created_at'],
                ]
            );
        }
    }
}


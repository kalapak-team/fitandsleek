<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        // Get all products and customers
        $products = Product::all();
        $customers = User::where('role', 'customer')->get();

        if ($products->isEmpty() || $customers->isEmpty()) {
            return;
        }

        $orders = [
            // Completed orders (these contribute to revenue)
            [
                'user_id' => 1,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 52.80,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 58.79,
                'created_at' => now()->subDays(2),
            ],
            [
                'user_id' => 2,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 89.70,
                'shipping' => 0,
                'discount' => 5.00,
                'total' => 84.70,
                'created_at' => now()->subDays(3),
            ],
            [
                'user_id' => 3,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 124.50,
                'shipping' => 7.99,
                'discount' => 0,
                'total' => 132.49,
                'created_at' => now()->subDays(5),
            ],
            [
                'user_id' => 4,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 67.80,
                'shipping' => 5.99,
                'discount' => 3.00,
                'total' => 70.79,
                'created_at' => now()->subDays(7),
            ],
            [
                'user_id' => 5,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 45.90,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 51.89,
                'created_at' => now()->subDays(8),
            ],
            [
                'user_id' => 6,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 198.40,
                'shipping' => 0,
                'discount' => 15.00,
                'total' => 183.40,
                'created_at' => now()->subDays(10),
            ],
            [
                'user_id' => 1,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 78.70,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 84.69,
                'created_at' => now()->subDays(12),
            ],
            [
                'user_id' => 2,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 156.80,
                'shipping' => 7.99,
                'discount' => 10.00,
                'total' => 154.79,
                'created_at' => now()->subDays(14),
            ],
            [
                'user_id' => 7,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 89.90,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 95.89,
                'created_at' => now()->subDays(15),
            ],
            [
                'user_id' => 8,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 112.40,
                'shipping' => 0,
                'discount' => 5.00,
                'total' => 107.40,
                'created_at' => now()->subDays(18),
            ],
            [
                'user_id' => 9,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 67.80,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 73.79,
                'created_at' => now()->subDays(20),
            ],
            [
                'user_id' => 10,
                'status' => 'completed',
                'payment_status' => 'paid',
                'subtotal' => 234.50,
                'shipping' => 7.99,
                'discount' => 20.00,
                'total' => 222.49,
                'created_at' => now()->subDays(22),
            ],
            // Processing orders
            [
                'user_id' => 3,
                'status' => 'processing',
                'payment_status' => 'paid',
                'subtotal' => 89.70,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 95.69,
                'created_at' => now()->subDays(1),
            ],
            [
                'user_id' => 4,
                'status' => 'processing',
                'payment_status' => 'paid',
                'subtotal' => 156.80,
                'shipping' => 0,
                'discount' => 10.00,
                'total' => 146.80,
                'created_at' => now()->subHours(12),
            ],
            // Pending orders (don't count toward revenue in report)
            [
                'user_id' => 5,
                'status' => 'pending',
                'payment_status' => 'pending',
                'subtotal' => 45.90,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 51.89,
                'created_at' => now()->subHours(6),
            ],
            [
                'user_id' => 6,
                'status' => 'pending',
                'payment_status' => 'pending',
                'subtotal' => 78.70,
                'shipping' => 5.99,
                'discount' => 0,
                'total' => 84.69,
                'created_at' => now()->subHours(3),
            ],
        ];

        foreach ($orders as $orderData) {
            $order = Order::create([
                'user_id' => $orderData['user_id'],
                'order_number' => 'ORD-' . strtoupper(uniqid()),
                'status' => $orderData['status'],
                'payment_status' => $orderData['payment_status'],
                'subtotal' => $orderData['subtotal'],
                'shipping' => $orderData['shipping'],
                'discount' => $orderData['discount'],
                'total' => $orderData['total'],
                'shipping_address' => json_encode([
                    'street' => '123 Test Street',
                    'city' => 'Test City',
                    'state' => 'TS',
                    'zip' => '12345',
                    'country' => 'USA'
                ]),
                'billing_address' => json_encode([
                    'street' => '123 Test Street',
                    'city' => 'Test City',
                    'state' => 'TS',
                    'zip' => '12345',
                    'country' => 'USA'
                ]),
                'created_at' => $orderData['created_at'],
                'updated_at' => $orderData['created_at'],
            ]);

            // Add order items (1-3 items per order)
            $numItems = rand(1, 3);
            $selectedProducts = $products->random($numItems);

            foreach ($selectedProducts as $product) {
                $qty = rand(1, 3);
                $lineTotal = $product->price * $qty;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'price' => $product->price,
                    'qty' => $qty,
                    'line_total' => $lineTotal,
                ]);

                // Update product stock
                if ($product->stock >= $qty) {
                    $product->stock -= $qty;
                    $product->save();
                }
            }
        }
    }
}


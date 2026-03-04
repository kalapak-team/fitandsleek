<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Sale;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class SaleSeeder extends Seeder
{
    public function run(): void
    {
        // Get some products to add discounts to
        $products = Product::inRandomOrder()->limit(15)->get();

        $discountConfigs = [
            // Percentage discounts
            ['type' => 'percentage', 'value' => 10, 'price_multiplier' => 0.9],
            ['type' => 'percentage', 'value' => 15, 'price_multiplier' => 0.85],
            ['type' => 'percentage', 'value' => 20, 'price_multiplier' => 0.8],
            ['type' => 'percentage', 'value' => 25, 'price_multiplier' => 0.75],
            ['type' => 'percentage', 'value' => 30, 'price_multiplier' => 0.7],
            
            // Fixed amount discounts
            ['type' => 'fixed', 'value' => 5, 'price_multiplier' => 0.85],
            ['type' => 'fixed', 'value' => 10, 'price_multiplier' => 0.8],
            ['type' => 'fixed', 'value' => 15, 'price_multiplier' => 0.75],
        ];

        foreach ($products as $index => $product) {
            $config = $discountConfigs[$index % count($discountConfigs)];
            
            // Calculate sale price
            if ($config['type'] === 'percentage') {
                $salePrice = round($product->price * $config['price_multiplier'], 2);
            } else {
                $salePrice = max($product->price - $config['value'], 1);
            }

            // Create or update sale
            Sale::updateOrCreate(
                ['product_id' => $product->id],
                [
                    'discount_type' => $config['type'],
                    'discount_value' => $config['value'],
                    'sale_price' => $salePrice,
                    'start_date' => Carbon::now()->subDays(5),
                    'end_date' => Carbon::now()->addDays(30),
                    'is_active' => true,
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Banner;
use App\Models\Collection;
use App\Models\Category;

class HomepageSeeder extends Seeder
{
    public function run(): void
    {
        // Create Banners
        $banners = [
            [
                'title' => 'Up to 50% Off',
                'subtitle' => 'Limited-time discounts on selected items.',
                'image_url' => 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=70',
                'link_url' => '/search?gender=sale',
                'position' => 'hero',
                'is_active' => true,
                'order' => 1,
            ],
            [
                'title' => 'Fresh street-ready drops',
                'subtitle' => 'New arrivals curated for daily wear.',
                'image_url' => 'https://images.unsplash.com/photo-1520975916090-3105956dac38?auto=format&fit=crop&w=1200&q=70',
                'link_url' => '/search?tab=new',
                'position' => 'hero',
                'is_active' => true,
                'order' => 2,
            ],
        ];

        foreach ($banners as $banner) {
            Banner::updateOrCreate(
                ['title' => $banner['title']],
                $banner
            );
        }

        // Create Collections
        $collections = [
            [
                'name' => 'Women Collection',
                'slug' => 'women-collection',
                'description' => 'Discover the latest trends in women\'s fashion. From casual wear to streetwear.',
                'image_url' => 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?auto=format&fit=crop&w=1200&q=70',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Men Collection',
                'slug' => 'men-collection',
                'description' => 'Explore our curated collection of men\'s fashion and streetwear.',
                'image_url' => 'https://images.unsplash.com/photo-1520975693411-b4d02a2be7d1?auto=format&fit=crop&w=1200&q=70',
                'is_active' => true,
                'sort_order' => 2,
            ],
        ];

        foreach ($collections as $collection) {
            Collection::updateOrCreate(
                ['slug' => $collection['slug']],
                $collection
            );
        }

        // Create default categories if they don't exist
        $categories = [
            ['name' => 'Clothes', 'slug' => 'clothes', 'gender' => 'both'],
            ['name' => 'Shoes', 'slug' => 'shoes', 'gender' => 'both'],
            ['name' => 'Belts', 'slug' => 'belts', 'gender' => 'both'],
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['slug' => $category['slug']],
                $category
            );
        }
    }
}


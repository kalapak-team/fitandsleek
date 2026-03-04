<?php

namespace Database\Seeders;

use App\Models\Setting;
use Illuminate\Database\Seeder;

class FooterHeaderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Footer settings
        $footerSettings = [
            // Brand
            ['key' => 'footer_brand_name', 'value' => 'Fitandsleek', 'type' => 'string', 'group' => 'footer'],
            ['key' => 'footer_brand_tagline', 'value' => 'Modern fashion store for slick everyday outfits and streetwear.', 'type' => 'string', 'group' => 'footer'],
            
            // Contact info
            ['key' => 'footer_contact_email', 'value' => 'kalapakgpt@gmail.com', 'type' => 'string', 'group' => 'footer'],
            ['key' => 'footer_contact_phone', 'value' => '+855 00 00 000', 'type' => 'string', 'group' => 'footer'],
            ['key' => 'footer_contact_address', 'value' => 'Phnom Penh, Cambodia', 'type' => 'string', 'group' => 'footer'],
            
            // Copyright & bottom links
            ['key' => 'footer_copyright_text', 'value' => '© {year} Fitandsleek. All rights reserved.', 'type' => 'string', 'group' => 'footer'],
            ['key' => 'footer_bottom_links', 'value' => json_encode([
                ['label' => 'Terms', 'to' => '/terms'],
                ['label' => 'Privacy', 'to' => '/privacy'],
            ]), 'type' => 'json', 'group' => 'footer'],
            
            // Shop links
            ['key' => 'footer_shop_links', 'value' => json_encode([
                ['label' => 'All Products', 'to' => '/search'],
                ['label' => 'Women', 'to' => '/search?gender=women'],
                ['label' => 'Men', 'to' => '/search?gender=men'],
                ['label' => 'Cart', 'to' => '/cart'],
            ]), 'type' => 'json', 'group' => 'footer'],
            
            // Help links
            ['key' => 'footer_help_links', 'value' => json_encode([
                ['label' => 'Support', 'to' => '/support'],
                ['label' => 'Order Tracking', 'to' => '/track-order'],
                ['label' => 'Privacy', 'to' => '/privacy'],
            ]), 'type' => 'json', 'group' => 'footer'],
        ];

        // Header navigation settings
        $headerSettings = [
            ['key' => 'header_nav_new_in', 'value' => json_encode([
                ['label' => 'New Arrivals', 'to' => '/search?tab=new'],
                ['label' => 'Trending Now', 'to' => '/search?tab=trending'],
                ['label' => 'This Week', 'to' => '/search?tab=this-week'],
            ]), 'type' => 'json', 'group' => 'header'],
            
            ['key' => 'header_nav_women', 'value' => json_encode([
                [
                    'type' => 'section',
                    'label' => 'Clothing',
                    'items' => [
                        ['label' => 'Tops', 'to' => '/search?gender=women&category=tops'],
                        ['label' => 'Bottoms', 'to' => '/search?gender=women&category=bottoms'],
                        ['label' => 'Dresses', 'to' => '/search?gender=women&category=dresses'],
                        ['label' => 'Outerwear', 'to' => '/search?gender=women&category=outerwear'],
                        ['label' => 'Activewear', 'to' => '/search?gender=women&category=activewear'],
                    ],
                ],
                [
                    'type' => 'section',
                    'label' => 'Shoes',
                    'items' => [
                        ['label' => 'Sneakers', 'to' => '/search?gender=women&category=sneakers'],
                        ['label' => 'Slides', 'to' => '/search?gender=women&category=slides'],
                        ['label' => 'Heels', 'to' => '/search?gender=women&category=heels'],
                        ['label' => 'Boots', 'to' => '/search?gender=women&category=boots'],
                    ],
                ],
                [
                    'type' => 'section',
                    'label' => 'Accessories',
                    'items' => [
                        ['label' => 'Bags', 'to' => '/search?gender=women&category=bags'],
                        ['label' => 'Belts', 'to' => '/search?gender=women&category=belts'],
                        ['label' => 'Hats', 'to' => '/search?gender=women&category=hats'],
                        ['label' => 'Jewelry', 'to' => '/search?gender=women&category=jewelry'],
                    ],
                ],
                [
                    'type' => 'section',
                    'label' => 'Girls',
                    'description' => 'Fresh drops for everyday fits',
                    'items' => [
                        ['label' => 'View All', 'to' => '/search?gender=girls'],
                        ['label' => 'New Arrivals', 'to' => '/search?tab=new&gender=girls'],
                        ['label' => 'Trending Now', 'to' => '/search?tab=trending&gender=girls'],
                        ['label' => 'This Week', 'to' => '/search?tab=this-week&gender=girls'],
                    ],
                ],
            ]), 'type' => 'json', 'group' => 'header'],
            
            ['key' => 'header_nav_men', 'value' => json_encode([
                [
                    'type' => 'section',
                    'label' => 'Clothing',
                    'items' => [
                        ['label' => 'T-Shirts', 'to' => '/search?gender=men&category=t-shirts'],
                        ['label' => 'Shirts', 'to' => '/search?gender=men&category=shirts'],
                        ['label' => 'Hoodies', 'to' => '/search?gender=men&category=hoodies'],
                        ['label' => 'Jeans', 'to' => '/search?gender=men&category=jeans'],
                        ['label' => 'Shorts', 'to' => '/search?gender=men&category=shorts'],
                    ],
                ],
                [
                    'type' => 'section',
                    'label' => 'Shoes',
                    'items' => [
                        ['label' => 'Sneakers', 'to' => '/search?gender=men&category=sneakers'],
                        ['label' => 'Running', 'to' => '/search?gender=men&category=running'],
                        ['label' => 'Slides', 'to' => '/search?gender=men&category=slides'],
                        ['label' => 'Boots', 'to' => '/search?gender=men&category=boots'],
                    ],
                ],
                [
                    'type' => 'section',
                    'label' => 'Accessories',
                    'items' => [
                        ['label' => 'Bags', 'to' => '/search?gender=men&category=bags'],
                        ['label' => 'Belts', 'to' => '/search?gender=men&category=belts'],
                        ['label' => 'Caps & Hats', 'to' => '/search?gender=men&category=caps-hats'],
                        ['label' => 'Watches', 'to' => '/search?gender=men&category=watches'],
                    ],
                ],
                [
                    'type' => 'section',
                    'label' => 'Boys',
                    'description' => 'Grab deals before they\'re gone',
                    'items' => [
                        ['label' => 'View All', 'to' => '/search?gender=boys'],
                        ['label' => 'New Arrivals', 'to' => '/search?tab=new&gender=boys'],
                        ['label' => 'Trending Now', 'to' => '/search?tab=trending&gender=boys'],
                        ['label' => 'This Week', 'to' => '/search?tab=this-week&gender=boys'],
                    ],
                ],
            ]), 'type' => 'json', 'group' => 'header'],
            
            ['key' => 'header_nav_sale', 'value' => json_encode([
                ['label' => 'All Sale Items', 'to' => '/search?tab=sale'],
                ['label' => "Women's Sale", 'to' => '/search?tab=sale&gender=women'],
                ['label' => "Men's Sale", 'to' => '/search?tab=sale&gender=men'],
            ]), 'type' => 'json', 'group' => 'header'],
        ];

        // Social media settings
        $socialSettings = [
            ['key' => 'social_facebook', 'value' => '', 'type' => 'string', 'group' => 'social'],
            ['key' => 'social_instagram', 'value' => '', 'type' => 'string', 'group' => 'social'],
            ['key' => 'social_twitter', 'value' => '', 'type' => 'string', 'group' => 'social'],
            ['key' => 'social_youtube', 'value' => '', 'type' => 'string', 'group' => 'social'],
            ['key' => 'social_tiktok', 'value' => '', 'type' => 'string', 'group' => 'social'],
        ];

        // Insert all settings
        foreach (array_merge($footerSettings, $headerSettings, $socialSettings) as $setting) {
            Setting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        $this->command->info('Footer & Header settings seeded successfully!');
    }
}


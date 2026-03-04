<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FooterHeaderController extends Controller
{
    /**
     * Get all footer and header settings
     */
    public function index()
    {
        $settings = Setting::orderBy('group')->orderBy('key')->get()->groupBy('group');
        
        return response()->json([
            'footer' => $this->formatFooterSettings($settings),
            'header' => $this->formatHeaderSettings($settings),
            'social' => $this->formatSocialSettings($settings),
        ]);
    }

    /**
     * Update all footer settings
     */
    public function updateFooter(Request $request)
    {
        $data = $request->validate([
            'brand_name' => 'nullable|string|max:100',
            'brand_tagline' => 'nullable|string|max:255',
            'copyright_text' => 'nullable|string|max:255',
            'contact_email' => 'nullable|email|max:100',
            'contact_phone' => 'nullable|string|max:50',
            'contact_address' => 'nullable|string|max:255',
            'shop_links' => 'nullable|json',
            'help_links' => 'nullable|json',
            'bottom_links' => 'nullable|json',
        ]);

        foreach ($data as $key => $value) {
            if ($value !== null) {
                Setting::updateOrCreate(
                    ['key' => "footer_{$key}"],
                    [
                        'value' => $value,
                        'type' => 'json',
                        'group' => 'footer',
                    ]
                );
            }
        }

        return $this->index();
    }

    /**
     * Update all header navigation settings
     */
    public function updateHeader(Request $request)
    {
        $data = $request->validate([
            'nav_new_in' => 'nullable|json',
            'nav_women' => 'nullable|json',
            'nav_men' => 'nullable|json',
            'nav_sale' => 'nullable|json',
        ]);

        foreach ($data as $key => $value) {
            if ($value !== null) {
                Setting::updateOrCreate(
                    ['key' => "header_{$key}"],
                    [
                        'value' => $value,
                        'type' => 'json',
                        'group' => 'header',
                    ]
                );
            }
        }

        return $this->index();
    }

    /**
     * Update social media links
     */
    public function updateSocial(Request $request)
    {
        $data = $request->validate([
            'facebook' => 'nullable|url|max:255',
            'instagram' => 'nullable|url|max:255',
            'twitter' => 'nullable|url|max:255',
            'youtube' => 'nullable|url|max:255',
            'tiktok' => 'nullable|url|max:255',
        ]);

        foreach ($data as $key => $value) {
            Setting::updateOrCreate(
                ['key' => "social_{$key}"],
                [
                    'value' => $value ?? '',
                    'type' => 'string',
                    'group' => 'social',
                ]
            );
        }

        return $this->index();
    }

    /**
     * Seed default footer and header settings
     */
    public function seedDefaults()
    {
        $footerDefaults = [
            'footer_brand_name' => 'Fitandsleek',
            'footer_brand_tagline' => 'Modern fashion store for slick everyday outfits and streetwear.',
            'footer_copyright_text' => '© {year} Fitandsleek. All rights reserved.',
            'footer_contact_email' => 'kalapakgpt@gmail.com',
            'footer_contact_phone' => '+855 00 00 000',
            'footer_contact_address' => 'Phnom Penh, Cambodia',
            'footer_shop_links' => json_encode([
                ['label' => 'All Products', 'to' => '/search'],
                ['label' => 'Women', 'to' => '/search?gender=women'],
                ['label' => 'Men', 'to' => '/search?gender=men'],
                ['label' => 'Cart', 'to' => '/cart'],
            ]),
            'footer_help_links' => json_encode([
                ['label' => 'Support', 'to' => '/support'],
                ['label' => 'Order Tracking', 'to' => '/track-order'],
                ['label' => 'Privacy', 'to' => '/privacy'],
            ]),
            'footer_bottom_links' => json_encode([
                ['label' => 'Terms', 'to' => '/terms'],
                ['label' => 'Privacy', 'to' => '/privacy'],
            ]),
        ];

        $headerDefaults = [
            'header_nav_new_in' => json_encode([
                ['label' => 'New Arrivals', 'to' => '/search?tab=new'],
                ['label' => 'Trending Now', 'to' => '/search?tab=trending'],
                ['label' => 'This Week', 'to' => '/search?tab=this-week'],
            ]),
            'header_nav_women' => json_encode([
                ['label' => 'All Women', 'to' => '/search?gender=women'],
                ['label' => 'Clothing', 'to' => '/search?gender=women&category=clothes'],
                ['label' => 'Shoes', 'to' => '/search?gender=women&category=shoes'],
                ['label' => 'Accessories', 'to' => '/search?gender=women&category=accessories'],
            ]),
            'header_nav_men' => json_encode([
                ['label' => 'All Men', 'to' => '/search?gender=men'],
                ['label' => 'Clothing', 'to' => '/search?gender=men&category=clothes'],
                ['label' => 'Shoes', 'to' => '/search?gender=men&category=shoes'],
                ['label' => 'Accessories', 'to' => '/search?gender=men&category=accessories'],
            ]),
            'header_nav_sale' => json_encode([
                ['label' => 'Sale', 'to' => '/search?tab=sale'],
            ]),
        ];

        $socialDefaults = [
            'social_facebook' => '',
            'social_instagram' => '',
            'social_twitter' => '',
            'social_youtube' => '',
            'social_tiktok' => '',
        ];

        foreach (array_merge($footerDefaults, $headerDefaults, $socialDefaults) as $key => $value) {
            $group = str_starts_with($key, 'footer_') ? 'footer' : 
                     (str_starts_with($key, 'header_') ? 'header' : 'social');
            $type = in_array($group, ['footer', 'header']) ? 'json' : 'string';
            
            Setting::updateOrCreate(
                ['key' => $key],
                [
                    'value' => $value,
                    'type' => $type,
                    'group' => $group,
                ]
            );
        }

        return response()->json(['message' => 'Default settings seeded successfully']);
    }

    /**
     * Format footer settings for frontend
     */
    private function formatFooterSettings($settings)
    {
        return [
            'brand_name' => $settings['footer']->where('key', 'footer_brand_name')->first()?->value ?? 'Fitandsleek',
            'brand_tagline' => $settings['footer']->where('key', 'footer_brand_tagline')->first()?->value ?? '',
            'copyright_text' => $settings['footer']->where('key', 'footer_copyright_text')->first()?->value ?? '© {year} Fitandsleek. All rights reserved.',
            'contact_email' => $settings['footer']->where('key', 'footer_contact_email')->first()?->value ?? '',
            'contact_phone' => $settings['footer']->where('key', 'footer_contact_phone')->first()?->value ?? '',
            'contact_address' => $settings['footer']->where('key', 'footer_contact_address')->first()?->value ?? '',
            'shop_links' => $settings['footer']->where('key', 'footer_shop_links')->first()?->value ?? [],
            'help_links' => $settings['footer']->where('key', 'footer_help_links')->first()?->value ?? [],
            'bottom_links' => $settings['footer']->where('key', 'footer_bottom_links')->first()?->value ?? [],
        ];
    }

    /**
     * Format header settings for frontend
     */
    private function formatHeaderSettings($settings)
    {
        return [
            'nav_new_in' => $settings['header']->where('key', 'header_nav_new_in')->first()?->value ?? [],
            'nav_women' => $settings['header']->where('key', 'header_nav_women')->first()?->value ?? [],
            'nav_men' => $settings['header']->where('key', 'header_nav_men')->first()?->value ?? [],
            'nav_sale' => $settings['header']->where('key', 'header_nav_sale')->first()?->value ?? [],
        ];
    }

    /**
     * Format social settings for frontend
     */
    private function formatSocialSettings($settings)
    {
        return [
            'facebook' => $settings['social']->where('key', 'social_facebook')->first()?->value ?? '',
            'instagram' => $settings['social']->where('key', 'social_instagram')->first()?->value ?? '',
            'twitter' => $settings['social']->where('key', 'social_twitter')->first()?->value ?? '',
            'youtube' => $settings['social']->where('key', 'social_youtube')->first()?->value ?? '',
            'tiktok' => $settings['social']->where('key', 'social_tiktok')->first()?->value ?? '',
        ];
    }
}


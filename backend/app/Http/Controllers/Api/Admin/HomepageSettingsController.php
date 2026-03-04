<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class HomepageSettingsController extends Controller
{
    private function resolveAppLogoUrl(): string
    {
        return asset(config('app.logo_url', '/logo.png'));
    }

    /**
     * Get all homepage settings (extended with NEW IN, WOMEN, MEN, BOYS, etc)
     */
    public function getSettings()
    {
        try {
            $appLogoUrl = $this->resolveAppLogoUrl();

            // Get all homepage-related settings
            $settings = Setting::where('group', 'homepage')->get()->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->value];
            });

            $fontSettings = Setting::whereIn('key', ['font_en', 'font_km'])->get()->mapWithKeys(function ($setting) {
                return [$setting->key => $setting->value];
            });

            // Default extended settings - ALL sections
            $defaults = [
                'fonts' => [
                    'english' => 'Inter',
                    'khmer' => 'Noto Sans Khmer',
                ],
                'hero' => [
                    'message' => '🚚 Free delivery on orders above $40',
                    'icon' => '🚚',
                    'enabled' => true,
                ],
                'sections' => [
                    'newIn' => ['title' => 'NEW IN', 'icon' => '📦', 'enabled' => true, 'order' => 1],
                    'discounts' => ['title' => '🎉 Discounts', 'icon' => '🎉', 'enabled' => true, 'order' => 2],
                    'women' => ['title' => 'WOMEN', 'icon' => '👗', 'enabled' => true, 'order' => 3],
                    'men' => ['title' => 'MEN', 'icon' => '👔', 'enabled' => true, 'order' => 4],
                    'boys' => ['title' => 'BOYS', 'icon' => '👦', 'enabled' => true, 'order' => 5],
                    'clothes' => ['title' => 'Clothes', 'icon' => '👕', 'enabled' => true, 'order' => 6],
                    'shoes' => ['title' => 'Shoes', 'icon' => '👠', 'enabled' => true, 'order' => 7],
                    'belts' => ['title' => 'Belts', 'icon' => '⏱️', 'enabled' => true, 'order' => 8],
                    'accessories' => ['title' => 'Accessories', 'icon' => '💍', 'enabled' => true, 'order' => 9],
                ],
                'header' => [
                    'logo_text' => 'Fitandsleek',
                    'logo_url' => $appLogoUrl,
                    'background_color' => '#6F8F72',
                    'search_placeholder' => 'Search products...',
                    'search_enabled' => true,
                    'cart_enabled' => true,
                    'wishlist_enabled' => true,
                    'language_enabled' => true,
                    'free_delivery_icon' => '🚚',
                    'free_delivery_text' => 'Free delivery on orders above $40',
                    'nav_visibility' => [
                        'newIn' => true,
                        'discounts' => true,
                        'women' => true,
                        'men' => true,
                        'sale' => true,
                    ],
                    'custom_nav' => [],
                    'left_menu' => [
                        [
                            'title' => 'Menu Visibility',
                            'items' => [
                                ['label' => 'NEW IN', 'to' => '/search?tab=new', 'image' => '/placeholder.svg'],
                                ['label' => 'Discounts', 'to' => '/discounts', 'image' => '/placeholder.svg'],
                                ['label' => 'Women', 'to' => '/search?gender=women', 'image' => '/placeholder.svg'],
                                ['label' => 'Men', 'to' => '/search?gender=men', 'image' => '/placeholder.svg'],
                                ['label' => 'Boys', 'to' => '/search?gender=boys', 'image' => '/placeholder.svg'],
                                ['label' => 'Girls', 'to' => '/search?gender=girls', 'image' => '/placeholder.svg'],
                                ['label' => 'Sale', 'to' => '/search?tab=sale', 'image' => '/placeholder.svg'],
                            ],
                        ],
                        [
                            'title' => 'New Product',
                            'items' => [
                                ['label' => 'New Arrivals', 'to' => '/search?tab=new', 'image' => '/placeholder.svg'],
                                ['label' => 'Trending Now', 'to' => '/search?tab=trending', 'image' => '/placeholder.svg'],
                                ['label' => 'This Week', 'to' => '/search?tab=this-week', 'image' => '/placeholder.svg'],
                                ['label' => 'Best Sellers', 'to' => '/search?q=Best%20Seller', 'image' => '/placeholder.svg'],
                                ['label' => 'Editor Picks', 'to' => '/search?q=Editors%20Pick', 'image' => '/placeholder.svg'],
                                ['label' => 'Limited Drop', 'to' => '/search?q=Limited%20Drop', 'image' => '/placeholder.svg'],
                                ['label' => 'Fresh Styles', 'to' => '/search?q=Fresh%20Style', 'image' => '/placeholder.svg'],
                                ['label' => 'Just Added', 'to' => '/search?q=Just%20Added', 'image' => '/placeholder.svg'],
                            ],
                        ],
                        [
                            'title' => 'Product Trending',
                            'items' => [
                                ['label' => 'Trending Now', 'to' => '/search?tab=trending', 'image' => '/placeholder.svg'],
                                ['label' => 'Top Rated', 'to' => '/search?sort=rating', 'image' => '/placeholder.svg'],
                                ['label' => 'Best Sellers', 'to' => '/search?sort=popular', 'image' => '/placeholder.svg'],
                                ['label' => 'Most Viewed', 'to' => '/search?q=Most%20Viewed', 'image' => '/placeholder.svg'],
                                ['label' => 'Popular Now', 'to' => '/search?q=Popular%20Now', 'image' => '/placeholder.svg'],
                                ['label' => 'Street Style', 'to' => '/search?q=Street%20Style', 'image' => '/placeholder.svg'],
                                ['label' => 'Viral Picks', 'to' => '/search?q=Viral', 'image' => '/placeholder.svg'],
                                ['label' => 'Trending This Week', 'to' => '/search?q=Trending%20This%20Week', 'image' => '/placeholder.svg'],
                            ],
                        ],
                        [
                            'title' => 'Product Discounts',
                            'items' => [
                                ['label' => 'All Discounts', 'to' => '/discounts', 'image' => '/placeholder.svg'],
                                ['label' => 'Clothes', 'to' => '/discounts/clothes', 'image' => '/placeholder.svg'],
                                ['label' => 'Shoes', 'to' => '/discounts/shoes', 'image' => '/placeholder.svg'],
                                ['label' => 'Under $20', 'to' => '/discounts?max_price=20', 'image' => '/placeholder.svg'],
                                ['label' => 'Top Deals', 'to' => '/discounts?sort=discount', 'image' => '/placeholder.svg'],
                                ['label' => 'Accessories', 'to' => '/discounts?q=Accessories', 'image' => '/placeholder.svg'],
                                ['label' => 'Bags', 'to' => '/discounts?q=Bags', 'image' => '/placeholder.svg'],
                                ['label' => 'Flash Sale', 'to' => '/discounts?q=Flash', 'image' => '/placeholder.svg'],
                            ],
                        ],
                        [
                            'title' => 'Brands & Categories',
                            'items' => [
                                ['label' => 'Brand Logos', 'to' => '/search', 'image' => '/placeholder.svg'],
                                ['label' => 'Categories', 'to' => '/search', 'image' => '/placeholder.svg'],
                                ['label' => 'Nike', 'to' => '/search?q=Nike', 'image' => '/placeholder.svg'],
                                ['label' => 'Adidas', 'to' => '/search?q=Adidas', 'image' => '/placeholder.svg'],
                                ['label' => 'Puma', 'to' => '/search?q=Puma', 'image' => '/placeholder.svg'],
                                ['label' => 'Zara', 'to' => '/search?q=Zara', 'image' => '/placeholder.svg'],
                                ['label' => 'Clothes', 'to' => '/search?q=Clothes', 'image' => '/placeholder.svg'],
                                ['label' => 'Accessories', 'to' => '/search?q=Accessories', 'image' => '/placeholder.svg'],
                            ],
                        ],
                    ],
                    'nav_labels' => [
                        'newIn' => 'NEW IN',
                        'newArrivals' => 'New Arrivals',
                        'trendingNow' => 'Trending Now',
                        'thisWeek' => 'This Week',
                        'discounts' => '🎉 Discounts',
                        'allDiscounts' => 'All Discounts',
                        'clothes' => 'Clothes',
                        'shoes' => 'Shoes',
                        'bags' => 'Bags',
                        'belts' => 'Belts',
                        'accessories' => 'Accessories',
                        'women' => 'WOMEN',
                        'tops' => 'Tops',
                        'bottoms' => 'Bottoms',
                        'dresses' => 'Dresses',
                        'outerwear' => 'Outerwear',
                        'activewear' => 'Activewear',
                        'sneakers' => 'Sneakers',
                        'slides' => 'Slides',
                        'heels' => 'Heels',
                        'boots' => 'Boots',
                        'hats' => 'Hats',
                        'jewelry' => 'Jewelry',
                        'girls' => 'Girls',
                        'freshDrops' => 'Fresh drops for everyday fits',
                        'viewAll' => 'View All',
                        'men' => 'MEN',
                        'tShirts' => 'T-Shirts',
                        'shirts' => 'Shirts',
                        'hoodies' => 'Hoodies',
                        'jeans' => 'Jeans',
                        'shorts' => 'Shorts',
                        'running' => 'Running',
                        'capsHats' => 'Caps & Hats',
                        'watches' => 'Watches',
                        'boys' => 'Boys',
                        'grabDeals' => 'Grab deals before they\'re gone',
                        'sale' => 'SALE',
                        'allSaleItems' => 'All Sale Items',
                        'womensSale' => 'Women\'s Sale',
                        'mensSale' => 'Men\'s Sale',
                    ],
                ],
                'footer' => [
                    'company_name' => 'Fitandsleek',
                    'company_description' => 'Modern fashion store for slick everyday outfits and streetwear.',
                    'contact_title' => 'CONTACT',
                    'contact_email' => 'kalapakgpt@gmail.com',
                    'contact_phone' => '+855 00 00 000',
                    'contact_address' => 'Phnom Penh, Cambodia',
                    'copyright_text' => '© 2026 Fitandsleek. All rights reserved.',
                    'background_color' => '#6F8F72',
                    'social_title' => 'FOLLOW US',
                    'social_enabled' => true,
                    'support_enabled' => true,
                    'tracking_enabled' => true,
                    'privacy_enabled' => true,
                    'contact_enabled' => true,
                ],
                'footer_socials' => [
                    ['platform' => 'facebook', 'url' => '#'],
                    ['platform' => 'instagram', 'url' => '#'],
                    ['platform' => 'twitter', 'url' => '#'],
                ],
                'footer_sections' => [
                    'support' => [
                        'title' => 'HELP',
                        'items' => [
                            ['label' => 'Help Center', 'link' => '/support'],
                            ['label' => 'FAQ', 'link' => '/faq'],
                            ['label' => 'Contact Us', 'link' => '/contact'],
                        ],
                    ],
                    'tracking' => [
                        'title' => 'TRACKING',
                        'items' => [
                            ['label' => 'Track Order', 'link' => '/track-order'],
                            ['label' => 'Returns', 'link' => '/returns'],
                            ['label' => 'Shipping Info', 'link' => '/shipping'],
                        ],
                    ],
                    'legal' => [
                        'title' => 'LEGAL',
                        'items' => [
                            ['label' => 'Privacy Policy', 'link' => '/privacy'],
                            ['label' => 'Terms & Conditions', 'link' => '/terms'],
                            ['label' => 'Cookies Policy', 'link' => '/cookies'],
                        ],
                    ],
                ],
                'footer_section_titles' => [
                    'support' => 'HELP',
                    'tracking' => 'TRACKING',
                    'legal' => 'LEGAL',
                ],
            ];

            // Merge with defaults
            if (empty($settings)) {
                $defaults['fonts'] = [
                    'english' => $fontSettings['font_en'] ?? $defaults['fonts']['english'],
                    'khmer' => $fontSettings['font_km'] ?? $defaults['fonts']['khmer'],
                ];
                $defaults['app_logo_url'] = $appLogoUrl;
                $defaults['header']['logo_url'] = $appLogoUrl;
                return response()->json($defaults, 200);
            }
            // Parse JSON settings - the Setting model's mutator already decodes JSON
            $parsedSettings = [];
            foreach ($defaults as $category => $defaultValue) {
                if (isset($settings[$category])) {
                    // $settings values are already decoded by Setting model mutator
                    $value = $settings[$category];
                    // If it's still a string (shouldn't happen), decode it. Otherwise use it as is.
                    $parsedSettings[$category] = is_string($value) ? (json_decode($value, true) ?? $defaultValue) : $value;
                } else {
                    $parsedSettings[$category] = $defaultValue;
                }
            }

            // Ensure header nav_labels contain latest defaults
            $defaultHeader = $defaults['header'] ?? [];
            $header = $parsedSettings['header'] ?? $defaultHeader;
            $defaultNavLabels = $defaultHeader['nav_labels'] ?? [];
            $currentNavLabels = is_array($header['nav_labels'] ?? null) ? $header['nav_labels'] : [];
            $mergedNavLabels = array_merge($defaultNavLabels, $currentNavLabels);
            $header['nav_labels'] = $mergedNavLabels;
            $header['logo_url'] = $appLogoUrl;
            $parsedSettings['header'] = $header;

            // Persist header defaults if missing (hard-save)
            Setting::updateOrCreate(
                ['key' => 'header', 'group' => 'homepage'],
                ['value' => $header, 'type' => 'json']
            );

            $parsedSettings['fonts'] = [
                'english' => $fontSettings['font_en'] ?? $defaults['fonts']['english'],
                'khmer' => $fontSettings['font_km'] ?? $defaults['fonts']['khmer'],
            ];

            // Normalize footer sections (support both old and new structures)
            $footerSectionTitles = $parsedSettings['footer_section_titles'] ?? $defaults['footer_section_titles'];
            $footerSections = $parsedSettings['footer_sections'] ?? $defaults['footer_sections'];

            if (is_array($footerSections)) {
                $isOldSupportList = isset($footerSections['support']) && is_array($footerSections['support']) && array_is_list($footerSections['support']);
                $isOldTrackingList = isset($footerSections['tracking']) && is_array($footerSections['tracking']) && array_is_list($footerSections['tracking']);
                $isOldLegalList = isset($footerSections['legal']) && is_array($footerSections['legal']) && array_is_list($footerSections['legal']);

                if ($isOldSupportList || $isOldTrackingList || $isOldLegalList) {
                    $parsedSettings['footer_sections'] = [
                        'support' => [
                            'title' => $footerSectionTitles['support'] ?? 'HELP',
                            'items' => $footerSections['support'] ?? [],
                        ],
                        'tracking' => [
                            'title' => $footerSectionTitles['tracking'] ?? 'TRACKING',
                            'items' => $footerSections['tracking'] ?? [],
                        ],
                        'legal' => [
                            'title' => $footerSectionTitles['legal'] ?? 'LEGAL',
                            'items' => $footerSections['legal'] ?? [],
                        ],
                    ];
                } else {
                    // Ensure titles exist when using new structure
                    $parsedSettings['footer_sections'] = [
                        'support' => [
                            'title' => $footerSections['support']['title'] ?? ($footerSectionTitles['support'] ?? 'HELP'),
                            'items' => $footerSections['support']['items'] ?? [],
                        ],
                        'tracking' => [
                            'title' => $footerSections['tracking']['title'] ?? ($footerSectionTitles['tracking'] ?? 'TRACKING'),
                            'items' => $footerSections['tracking']['items'] ?? [],
                        ],
                        'legal' => [
                            'title' => $footerSections['legal']['title'] ?? ($footerSectionTitles['legal'] ?? 'LEGAL'),
                            'items' => $footerSections['legal']['items'] ?? [],
                        ],
                    ];
                }
            }

            $parsedSettings['footer_section_titles'] = $footerSectionTitles;
            if (empty($parsedSettings['footer_socials'])) {
                $parsedSettings['footer_socials'] = $defaults['footer_socials'];
            }

            $parsedSettings['app_logo_url'] = $appLogoUrl;

            return response()->json($parsedSettings, 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update sections settings
     */
    public function updateSections(Request $request)
    {
        try {
            $validated = $request->validate([
                'sections' => 'required|array',
            ]);

            // Save sections as JSON
            Setting::updateOrCreate(
                ['key' => 'sections', 'group' => 'homepage'],
                ['value' => json_encode($validated['sections']), 'type' => 'json']
            );

            return response()->json([
                'message' => 'Homepage sections updated successfully',
                'sections' => $validated['sections']
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update header settings
     */
    public function updateHeader(Request $request)
    {
        try {
            $validated = $request->validate([
                'logo_text' => 'required|string|max:50',
                'search_enabled' => 'boolean',
                'cart_enabled' => 'boolean',
                'wishlist_enabled' => 'boolean',
                'language_enabled' => 'boolean',
            ]);

            // Save header settings as JSON
            Setting::updateOrCreate(
                ['key' => 'header', 'group' => 'homepage'],
                ['value' => json_encode($validated), 'type' => 'json']
            );

            return response()->json([
                'message' => 'Header settings updated successfully',
                'header' => $validated
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update footer settings
     */
    public function updateFooter(Request $request)
    {
        try {
            $validated = $request->validate([
                'company_name' => 'required|string|max:100',
                'company_description' => 'nullable|string',
                'copyright_text' => 'required|string|max:200',
                'support_enabled' => 'boolean',
                'tracking_enabled' => 'boolean',
                'privacy_enabled' => 'boolean',
                'contact_enabled' => 'boolean',
            ]);

            // Save footer settings as JSON
            Setting::updateOrCreate(
                ['key' => 'footer', 'group' => 'homepage'],
                ['value' => json_encode($validated), 'type' => 'json']
            );

            return response()->json([
                'message' => 'Footer settings updated successfully',
                'footer' => $validated
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update footer sections (links)
     */
    public function updateFooterSections(Request $request)
    {
        try {
            $validated = $request->validate([
                'footer_sections' => 'required|array',
            ]);

            // Save footer sections as JSON
            Setting::updateOrCreate(
                ['key' => 'footer_sections', 'group' => 'homepage'],
                ['value' => json_encode($validated['footer_sections']), 'type' => 'json']
            );

            return response()->json([
                'message' => 'Footer sections updated successfully',
                'footer_sections' => $validated['footer_sections']
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Save all homepage settings at once
     */
    public function saveAll(Request $request)
    {
        try {
            $validated = $request->validate([
                'sections' => 'array',
                'header' => 'array',
                'footer' => 'array',
                'footer_sections' => 'array',
            ]);

            // Save each section
            if (!empty($validated['sections'])) {
                Setting::updateOrCreate(
                    ['key' => 'sections', 'group' => 'homepage'],
                    ['value' => json_encode($validated['sections']), 'type' => 'json']
                );
            }

            if (!empty($validated['header'])) {
                Setting::updateOrCreate(
                    ['key' => 'header', 'group' => 'homepage'],
                    ['value' => json_encode($validated['header']), 'type' => 'json']
                );
            }

            if (!empty($validated['footer'])) {
                Setting::updateOrCreate(
                    ['key' => 'footer', 'group' => 'homepage'],
                    ['value' => json_encode($validated['footer']), 'type' => 'json']
                );
            }

            if (!empty($validated['footer_sections'])) {
                Setting::updateOrCreate(
                    ['key' => 'footer_sections', 'group' => 'homepage'],
                    ['value' => json_encode($validated['footer_sections']), 'type' => 'json']
                );
            }

            return response()->json([
                'message' => 'All homepage settings saved successfully',
                'data' => $validated
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Save hero banner settings (extended)
     */
    public function updateHero(Request $request)
    {
        $validated = $request->validate([
            'message' => 'string|max:255',
            'icon' => 'string|max:10',
            'enabled' => 'boolean',
        ]);

        Setting::updateOrCreate(
            ['key' => 'hero', 'group' => 'homepage'],
            ['value' => $validated]
        );

        return response()->json(['message' => 'Hero banner updated', 'data' => $validated], 200);
    }

    /**
     * Save extended sections with subsections
     */
    public function updateSectionsExtended(Request $request)
    {
        $validated = $request->validate([
            'sections' => 'array|required',
            'subsections' => 'array',
        ]);

        Setting::updateOrCreate(
            ['key' => 'sections', 'group' => 'homepage'],
            ['value' => $validated['sections']]
        );

        if (!empty($validated['subsections'])) {
            Setting::updateOrCreate(
                ['key' => 'subsections', 'group' => 'homepage'],
                ['value' => $validated['subsections']]
            );
        }

        return response()->json(['message' => 'Sections updated', 'data' => $validated], 200);
    }

    /**
     * Save extended header settings
     */
    public function updateHeaderExtended(Request $request)
    {
        $validated = $request->validate([
            'logo_text' => 'string|max:100',
            'logo_url' => 'string|max:255',
            'background_color' => 'string|max:20',
            'search_placeholder' => 'string|max:100',
            'search_enabled' => 'boolean',
            'cart_enabled' => 'boolean',
            'wishlist_enabled' => 'boolean',
            'language_enabled' => 'boolean',
            'free_delivery_icon' => 'string|max:10',
            'free_delivery_text' => 'string|max:120',
            'nav_visibility' => 'array',
            'custom_nav' => 'array',
            'left_menu' => 'array',
            'nav_labels' => 'array',
        ]);

        Setting::updateOrCreate(
            ['key' => 'header', 'group' => 'homepage'],
            ['value' => $validated]
        );

        return response()->json(['message' => 'Header updated', 'data' => $validated], 200);
    }

    /**
     * Save extended footer settings
     */
    public function updateFooterExtended(Request $request)
    {
        $validated = $request->validate([
            'footer' => 'array',
            'sections' => 'array',
            'footer_sections' => 'array',
            'footer_section_titles' => 'array',
            'footer_socials' => 'array',
        ]);

        if (!empty($validated['footer'])) {
            Setting::updateOrCreate(
                ['key' => 'footer', 'group' => 'homepage'],
                ['value' => $validated['footer']]
            );
        }

        if (!empty($validated['sections'])) {
            Setting::updateOrCreate(
                ['key' => 'footer_sections', 'group' => 'homepage'],
                ['value' => $validated['sections']]
            );
        }

        if (!empty($validated['footer_sections'])) {
            Setting::updateOrCreate(
                ['key' => 'footer_sections', 'group' => 'homepage'],
                ['value' => $validated['footer_sections']]
            );
        }

        if (!empty($validated['footer_section_titles'])) {
            Setting::updateOrCreate(
                ['key' => 'footer_section_titles', 'group' => 'homepage'],
                ['value' => $validated['footer_section_titles']]
            );
        }

        if (!empty($validated['footer_socials'])) {
            Setting::updateOrCreate(
                ['key' => 'footer_socials', 'group' => 'homepage'],
                ['value' => $validated['footer_socials']]
            );
        }

        return response()->json(['message' => 'Footer updated', 'data' => $validated], 200);
    }

    /**
     * Upload header logo image
     */
    public function uploadLogo(Request $request)
    {
        $validated = $request->validate([
            'logo' => 'required|image|mimes:jpg,jpeg,png,webp,svg|max:5120',
        ]);

        $path = $request->file('logo')->store('logos', 'public');
        $url = Storage::disk('public')->url($path);

        $current = Setting::where('key', 'header')->where('group', 'homepage')->first();
        $header = $current ? (array) $current->value : [];
        $header['logo_url'] = $url;

        Setting::updateOrCreate(
            ['key' => 'header', 'group' => 'homepage'],
            ['value' => $header]
        );

        return response()->json([
            'message' => 'Logo uploaded',
            'logo_url' => $url,
        ], 200);
    }

    /**
     * Upload left menu item image
     */
    public function uploadMenuImage(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp,svg|max:5120',
        ]);

        $path = $request->file('image')->store('menu-images', 'public');
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'message' => 'Image uploaded',
            'image_url' => $url,
        ], 200);
    }
}

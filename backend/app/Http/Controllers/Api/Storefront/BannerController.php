<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Support\Media;

class BannerController extends Controller
{
    /**
     * Get all active banners (for admin/preview)
     */
    public function all()
    {
        $items = Banner::where('is_active', true)
            ->orderBy('page')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'page' => $b->page ?? 'home',
                'sort_order' => (int)($b->sort_order ?? 0),
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'image_url' => Media::url($b->image_url),
                'link_url' => $b->link_url,
                'position' => $b->position ?? 'hero',
                'is_active' => (bool)$b->is_active,
            ]);

        return response()->json(['data' => $items]);
    }

    /**
    * Get banners by position (hero, mid, sidebar, popup, promo)
     */
    public function index(string $position)
    {
        $items = Banner::where('position', $position)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'page' => $b->page ?? 'home',
                'sort_order' => (int)($b->sort_order ?? 0),
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'image_url' => Media::url($b->image_url),
                'link_url' => $b->link_url,
                'position' => $b->position,
                'is_active' => (bool)$b->is_active,
            ]);

        return response()->json(['data' => $items]);
    }

    /**
     * Get banners by page
     */
    public function page(string $page)
    {
        $items = Banner::where('page', $page)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'page' => $b->page ?? 'home',
                'sort_order' => (int)($b->sort_order ?? 0),
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'image_url' => Media::url($b->image_url),
                'link_url' => $b->link_url,
                'position' => $b->position ?? 'hero',
                'is_active' => (bool)$b->is_active,
            ]);

        return response()->json(['data' => $items]);
    }
}

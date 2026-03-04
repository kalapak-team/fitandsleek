<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Support\Media;

class CollectionController extends Controller
{
    /**
     * Get all collections (for admin/preview)
     */
    public function index()
    {
        $items = Collection::where('is_active', true)
            ->orderBy('gender')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'gender' => $c->gender ?? null,
                'image_url' => Media::url($c->image_url),
                'image_path' => $c->image_url,
                'text_position' => $c->text_position ?? 'overlay',
                'link' => $c->link ?? null,
                'sort_order' => (int)($c->sort_order ?? 0),
                'is_active' => (bool)$c->is_active,
            ]);

        return response()->json(['data' => $items]);
    }

    /**
     * Get collections by gender
     */
    public function gender(string $gender)
    {
        $items = Collection::where('gender', $gender)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'gender' => $c->gender,
                'image_url' => Media::url($c->image_url),
                'image_path' => $c->image_url,
                'text_position' => $c->text_position ?? 'overlay',
                'link' => $c->link ?? null,
                'sort_order' => (int)($c->sort_order ?? 0),
                'is_active' => (bool)$c->is_active,
            ]);

        return response()->json(['data' => $items]);
    }
}

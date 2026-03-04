<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Support\Media;

class BrandController extends Controller
{
    public function index()
    {
        $items = Brand::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(function ($b) {
                return [
                    'id' => $b->id,
                    'name' => $b->name,
                    'slug' => $b->slug,
                    'logo_url' => Media::publicUrl($b->logo_path),
                    'sort_order' => $b->sort_order,
                ];
            });

        return response()->json(['data' => $items]);
    }

    public function show(string $slug)
    {
        $brand = Brand::query()
            ->where('is_active', true)
            ->where('slug', $slug)
            ->firstOrFail();

        return response()->json([
            'id' => $brand->id,
            'name' => $brand->name,
            'slug' => $brand->slug,
            'logo_url' => Media::publicUrl($brand->logo_path),
            'sort_order' => $brand->sort_order,
        ]);
    }
}

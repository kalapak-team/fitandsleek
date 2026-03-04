<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\Media;

class CategoryController extends Controller
{
    public function index()
    {
        $cats = Category::where('is_active', true)->orderBy('sort_order')->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'type' => $c->type,
                'image_url' => Media::url($c->image_path),
            ]);

        return response()->json($cats);
    }
}

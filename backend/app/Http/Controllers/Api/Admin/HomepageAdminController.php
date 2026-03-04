<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Models\Collection;
use App\Models\Brand;
use App\Models\Menu;
use App\Support\Media;

class HomepageAdminController extends Controller
{
    public function show()
    {
        $banners = Banner::query()
            ->latest('id')
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'position' => $b->position ?? 'home',
                'image' => $b->image_url,
                'image_url' => Media::url($b->image_url),
                'text_align' => $b->text_align ?? 'center',
                'is_active' => (bool) $b->is_active,
            ]);

        $collections = Collection::query()
            ->latest('id')
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug ?? null,
                'image' => $c->image_url,
                'image_url' => Media::url($c->image_url),
                'text_position' => $c->text_position ?? 'overlay',
                'is_active' => (bool) ($c->is_active ?? true),
            ]);

        $brands = class_exists(Brand::class)
            ? Brand::query()->orderBy('sort_order')->get()->map(fn ($br) => [
                'id' => $br->id,
                'name' => $br->name,
                'slug' => $br->slug,
                'logo_url' => Media::url($br->logo_path),
                'is_active' => (bool) $br->is_active,
                'sort_order' => $br->sort_order,
            ])
            : [];

        $menus = class_exists(Menu::class)
            ? Menu::query()->orderBy('sort_order')->get()
            : [];

        return response()->json([
            'data' => [
                'banners' => $banners,
                'collections' => $collections,
                'brands' => $brands,
                'menus' => $menus,
            ]
        ]);
    }
}

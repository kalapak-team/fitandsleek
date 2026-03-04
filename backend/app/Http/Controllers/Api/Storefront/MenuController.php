<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Support\Media;

class MenuController extends Controller
{
    public function index()
    {
        $menus = Menu::where('is_active', true)->orderBy('sort_order')->get()
            ->map(function ($m) {
                return [
                    'id' => $m->id,
                    'title' => $m->title,
                    'slug' => $m->slug,
                    'groups' => $m->groups ?? [],
                    'promo' => [
                        'title' => $m->promo_title,
                        'subtitle' => $m->promo_subtitle,
                        'image_url' => Media::url($m->promo_image_path),
                        'link' => $m->promo_link,
                    ],
                ];
            });

        return response()->json(['data' => $menus]);
    }
}

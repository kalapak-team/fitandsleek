<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Menu;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class MenuAdminController extends BaseAdminController
{
    public function index()
    {
        $items = Menu::orderBy('sort_order')->get()->map(fn($m)=>[
            'id'=>$m->id,'title'=>$m->title,'slug'=>$m->slug,
            'groups'=>$m->groups ?? [],
            'promo'=>[
                'title'=>$m->promo_title,'subtitle'=>$m->promo_subtitle,
                'image_url'=>Media::url($m->promo_image_path),
                'link'=>$m->promo_link,
            ],
            'sort_order'=>$m->sort_order,'is_active'=>$m->is_active,
        ]);
        return response()->json(['data'=>$items]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'title'=>['required','string','max:255'],
            'slug'=>['nullable','string','max:255','unique:menus,slug'],
            'groups'=>['nullable'], // JSON
            'promo_title'=>['nullable','string','max:255'],
            'promo_subtitle'=>['nullable','string','max:255'],
            'promo_link'=>['nullable','string','max:255'],
            'promo_image'=>['nullable','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'sort_order'=>['nullable','integer'],
            'is_active'=>['nullable'],
        ]);

        $slug = $v['slug'] ?? Str::slug($v['title']);
        $promoPath = $this->storeImage($request,'promo_image','menus');

        $groups = $request->input('groups');
        if (is_string($groups)) {
            $decoded = json_decode($groups, true);
            $groups = is_array($decoded) ? $decoded : [];
        }

        $m = Menu::create([
            'title'=>$v['title'],
            'slug'=>$slug,
            'groups'=>$groups ?? [],
            'promo_title'=>$v['promo_title'] ?? null,
            'promo_subtitle'=>$v['promo_subtitle'] ?? null,
            'promo_link'=>$v['promo_link'] ?? null,
            'promo_image_path'=>$promoPath,
            'sort_order'=>$v['sort_order'] ?? 0,
            'is_active'=>$this->bool($request->input('is_active', true)),
        ]);

        return response()->json(['data'=>[
            'id'=>$m->id,'title'=>$m->title,'slug'=>$m->slug,'groups'=>$m->groups ?? [],
            'promo'=>[
                'title'=>$m->promo_title,'subtitle'=>$m->promo_subtitle,
                'image_url'=>Media::url($m->promo_image_path),'link'=>$m->promo_link,
            ],
            'sort_order'=>$m->sort_order,'is_active'=>$m->is_active,
        ]], 201);
    }

    public function update(Request $request, Menu $menu)
    {
        $v = $request->validate([
            'title'=>['sometimes','required','string','max:255'],
            'slug'=>['sometimes','nullable','string','max:255','unique:menus,slug,'.$menu->id],
            'groups'=>['sometimes','nullable'],
            'promo_title'=>['sometimes','nullable','string','max:255'],
            'promo_subtitle'=>['sometimes','nullable','string','max:255'],
            'promo_link'=>['sometimes','nullable','string','max:255'],
            'promo_image'=>['sometimes','nullable','image','mimes:jpg,jpeg,png,webp','max:5120'],
            'remove_promo_image'=>['sometimes','nullable'],
            'sort_order'=>['sometimes','nullable','integer'],
            'is_active'=>['sometimes'],
        ]);

        if (array_key_exists('title',$v)) $menu->title = $v['title'];
        if (array_key_exists('slug',$v)) $menu->slug = $v['slug'] ?: Str::slug($menu->title);
        if ($request->has('sort_order')) $menu->sort_order = $request->input('sort_order') ?? 0;
        if ($request->has('is_active')) $menu->is_active = $this->bool($request->input('is_active'));

        if ($request->has('promo_title')) $menu->promo_title = $request->input('promo_title');
        if ($request->has('promo_subtitle')) $menu->promo_subtitle = $request->input('promo_subtitle');
        if ($request->has('promo_link')) $menu->promo_link = $request->input('promo_link');

        if ($this->bool($request->input('remove_promo_image', false)) && $menu->promo_image_path) {
            Storage::disk('public')->delete($menu->promo_image_path);
            $menu->promo_image_path = null;
        }

        if ($request->has('groups')) {
            $groups = $request->input('groups');
            if (is_string($groups)) {
                $decoded = json_decode($groups, true);
                $groups = is_array($decoded) ? $decoded : [];
            }
            $menu->groups = $groups ?? [];
        }

        $newPromo = $this->storeImage($request,'promo_image','menus');
        if ($newPromo) {
            if ($menu->promo_image_path) Storage::disk('public')->delete($menu->promo_image_path);
            $menu->promo_image_path = $newPromo;
        }

        $menu->save();

        return response()->json(['data'=>[
            'id'=>$menu->id,'title'=>$menu->title,'slug'=>$menu->slug,'groups'=>$menu->groups ?? [],
            'promo'=>[
                'title'=>$menu->promo_title,'subtitle'=>$menu->promo_subtitle,
                'image_url'=>Media::url($menu->promo_image_path),'link'=>$menu->promo_link,
            ],
            'sort_order'=>$menu->sort_order,'is_active'=>$menu->is_active,
        ]]);
    }

    public function destroy(Menu $menu)
    {
        if ($menu->promo_image_path) Storage::disk('public')->delete($menu->promo_image_path);
        $menu->delete();
        return response()->json(['ok'=>true]);
    }
}

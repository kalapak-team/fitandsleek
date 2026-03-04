<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Banner;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BannerAdminController extends Controller
{
    public function index()
    {
        $items = Banner::query()
            ->orderBy('page')
            ->orderBy('sort_order')
            ->orderBy('position')
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'page' => $b->page ?? 'home',
                'sort_order' => (int)($b->sort_order ?? 0),
                'title' => $b->title,
                'subtitle' => $b->subtitle,
                'link_url' => $b->link_url,
                'position' => $b->position,
                'is_active' => (bool)$b->is_active,
                'order' => (int)($b->order ?? 0),
                'image_url' => Media::url($b->image_url),
                'image_path' => $b->image_url,
            ]);

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'page' => ['nullable','string','max:50'],          // home/women/men
            'sort_order' => ['nullable','integer','min:0'],    // ordering
            'title' => ['nullable','string','max:255'],
            'subtitle' => ['nullable','string','max:255'],
            'link_url' => ['nullable','string','max:500'],
            'position' => ['required','in:hero,mid,sidebar,popup,promo'],
            'media_url' => ['nullable','string','max:1000'],
            'is_active' => ['nullable','boolean'],
            'order' => ['nullable','integer','min:0'],
            'image' => ['nullable','file','mimes:jpg,jpeg,png,webp,svg,gif,mp4,webm,ogg','max:51200'],
        ]);

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('banners', 'public');
        } elseif (!empty($validated['media_url'])) {
            $path = $validated['media_url'];
        }

        $b = Banner::create([
            'page' => $validated['page'] ?? 'home',
            'sort_order' => $validated['sort_order'] ?? 0,
            'title' => $validated['title'] ?? null,
            'subtitle' => $validated['subtitle'] ?? null,
            'link_url' => $validated['link_url'] ?? null,
            'position' => $validated['position'],
            'is_active' => $validated['is_active'] ?? true,
            'order' => $validated['order'] ?? 0,
            'image_url' => $path,
        ]);

        return response()->json(['data' => [
            'id' => $b->id,
            'page' => $b->page,
            'sort_order' => (int)$b->sort_order,
            'title' => $b->title,
            'subtitle' => $b->subtitle,
            'link_url' => $b->link_url,
            'position' => $b->position,
            'is_active' => (bool)$b->is_active,
            'order' => (int)$b->order,
            'image_url' => Media::url($b->image_url),
            'image_path' => $b->image_url,
        ]], 201);
    }

    public function show(Banner $banner)
    {
        return response()->json(['data' => [
            'id' => $banner->id,
            'page' => $banner->page ?? 'home',
            'sort_order' => (int)($banner->sort_order ?? 0),
            'title' => $banner->title,
            'subtitle' => $banner->subtitle,
            'link_url' => $banner->link_url,
            'position' => $banner->position,
            'is_active' => (bool)$banner->is_active,
            'order' => (int)($banner->order ?? 0),
            'image_url' => Media::url($banner->image_url),
            'image_path' => $banner->image_url,
        ]]);
    }

    public function update(Request $request, Banner $banner)
    {
        $validated = $request->validate([
            'page' => ['nullable','string','max:50'],
            'sort_order' => ['nullable','integer','min:0'],
            'title' => ['nullable','string','max:255'],
            'subtitle' => ['nullable','string','max:255'],
            'link_url' => ['nullable','string','max:500'],
            'position' => ['required','in:hero,mid,sidebar,popup,promo'],
            'media_url' => ['nullable','string','max:1000'],
            'is_active' => ['nullable','boolean'],
            'order' => ['nullable','integer','min:0'],
            'image' => ['nullable','file','mimes:jpg,jpeg,png,webp,svg,gif,mp4,webm,ogg','max:51200'],
        ]);

        if ($request->hasFile('image')) {
            if ($banner->image_url && !preg_match('#^https?://#i', $banner->image_url)) {
                Storage::disk('public')->delete($banner->image_url);
            }
            $banner->image_url = $request->file('image')->store('banners', 'public');
        } elseif (!empty($validated['media_url'])) {
            $banner->image_url = $validated['media_url'];
        }

        $banner->page = $validated['page'] ?? $banner->page ?? 'home';
        $banner->sort_order = $validated['sort_order'] ?? ($banner->sort_order ?? 0);
        $banner->title = $validated['title'] ?? $banner->title;
        $banner->subtitle = $validated['subtitle'] ?? $banner->subtitle;
        $banner->link_url = $validated['link_url'] ?? $banner->link_url;
        $banner->position = $validated['position'];
        $banner->is_active = $validated['is_active'] ?? $banner->is_active;
        $banner->order = $validated['order'] ?? ($banner->order ?? 0);
        $banner->save();

        return response()->json(['data' => [
            'id' => $banner->id,
            'page' => $banner->page ?? 'home',
            'sort_order' => (int)($banner->sort_order ?? 0),
            'title' => $banner->title,
            'subtitle' => $banner->subtitle,
            'link_url' => $banner->link_url,
            'position' => $banner->position,
            'is_active' => (bool)$banner->is_active,
            'order' => (int)($banner->order ?? 0),
            'image_url' => Media::url($banner->image_url),
            'image_path' => $banner->image_url,
        ]]);
    }

    public function destroy(Banner $banner)
    {
        if ($banner->image_url) Storage::disk('public')->delete($banner->image_url);
        $banner->delete();
        return response()->json(['ok' => true]);
    }
}

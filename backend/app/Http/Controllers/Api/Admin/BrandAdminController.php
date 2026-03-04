<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BrandAdminController extends Controller
{
    public function index()
    {
        $items = Brand::query()->orderBy('sort_order')->latest('id')->get()->map(function ($b) {
            return [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                'logo_path' => $b->logo_path,
                'logo_url' => Media::publicUrl($b->logo_path),
                'sort_order' => $b->sort_order,
                'is_active' => (bool) $b->is_active,
                'created_at' => $b->created_at,
            ];
        });

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:120'],
            'slug' => ['required','string','max:140','unique:brands,slug'],
            'sort_order' => ['nullable','integer','min:0'],
            'is_active' => ['nullable','boolean'],
            'logo' => ['required','image','mimes:jpg,jpeg,png,webp,svg','max:5120'],
        ]);

        $path = $request->file('logo')->store('brands', 'public');

        $b = Brand::create([
            'name' => $validated['name'],
            'slug' => $validated['slug'],
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'logo_path' => $path,
        ]);

        return response()->json([
            'data' => [
                'id' => $b->id,
                'name' => $b->name,
                'slug' => $b->slug,
                'logo_path' => $b->logo_path,
                'logo_url' => Media::publicUrl($b->logo_path),
                'sort_order' => $b->sort_order,
                'is_active' => (bool) $b->is_active,
            ]
        ], 201);
    }

    public function update(Request $request, Brand $brand)
    {
        $validated = $request->validate([
            'name' => ['sometimes','required','string','max:120'],
            'slug' => ['sometimes','required','string','max:140','unique:brands,slug,'.$brand->id],
            'sort_order' => ['sometimes','nullable','integer','min:0'],
            'is_active' => ['sometimes','nullable','boolean'],
            'logo' => ['sometimes','image','mimes:jpg,jpeg,png,webp,svg','max:5120'],
        ]);

        if ($request->hasFile('logo')) {
            if ($brand->logo_path) Storage::disk('public')->delete($brand->logo_path);
            $brand->logo_path = $request->file('logo')->store('brands', 'public');
        }

        foreach (['name','slug','sort_order','is_active'] as $f) {
            if (array_key_exists($f, $validated)) $brand->{$f} = $validated[$f];
        }

        $brand->save();

        return response()->json([
            'data' => [
                'id' => $brand->id,
                'name' => $brand->name,
                'slug' => $brand->slug,
                'logo_path' => $brand->logo_path,
                'logo_url' => Media::publicUrl($brand->logo_path),
                'sort_order' => $brand->sort_order,
                'is_active' => (bool) $brand->is_active,
            ]
        ]);
    }

    public function destroy(Brand $brand)
    {
        if ($brand->logo_path) {
            Storage::disk('public')->delete($brand->logo_path);
        }

        $brand->delete();

        return response()->json(['message' => 'Brand deleted']);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Support\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CategoryAdminController extends Controller
{
    public function index()
    {
        $items = Category::query()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'type' => $c->type,
                'sort_order' => (int)($c->sort_order ?? 0),
                'is_active' => (bool)$c->is_active,
                'image_url' => Media::url($c->image_path),
                'image_path' => $c->image_path,
            ]);

        return response()->json(['data' => $items]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:categories,slug'],
            'type' => ['nullable','string','max:50'], // ✅ optional now
            'sort_order' => ['nullable','integer','min:0'],
            'is_active' => ['nullable','boolean'],
            'image' => ['nullable','image','mimes:jpg,jpeg,png,webp,svg','max:5120'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);
        // ensure unique slug if null provided and duplicate happens
        $base = $slug; $i = 1;
        while (Category::where('slug', $slug)->exists()) {
            $slug = $base . '-' . $i++;
        }

        $path = null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('categories', 'public');
        }

        $c = Category::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'type' => $validated['type'] ?? null,
            'sort_order' => $validated['sort_order'] ?? 0,
            'is_active' => $validated['is_active'] ?? true,
            'image_path' => $path,
        ]);

        return response()->json(['data' => [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'type' => $c->type,
            'sort_order' => (int)$c->sort_order,
            'is_active' => (bool)$c->is_active,
            'image_url' => Media::url($c->image_path),
            'image_path' => $c->image_path,
        ]], 201);
    }

    public function show(Category $category)
    {
        return response()->json(['data' => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'type' => $category->type,
            'sort_order' => (int)($category->sort_order ?? 0),
            'is_active' => (bool)$category->is_active,
            'image_url' => Media::url($category->image_path),
            'image_path' => $category->image_path,
        ]]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => ['required','string','max:255'],
            'slug' => ['nullable','string','max:255','unique:categories,slug,' . $category->id],
            'type' => ['nullable','string','max:50'], // ✅ optional
            'sort_order' => ['nullable','integer','min:0'],
            'is_active' => ['nullable','boolean'],
            'image' => ['nullable','image','mimes:jpg,jpeg,png,webp,svg','max:5120'],
        ]);

        $slug = $validated['slug'] ?? Str::slug($validated['name']);

        if ($request->hasFile('image')) {
            if ($category->image_path) Storage::disk('public')->delete($category->image_path);
            $category->image_path = $request->file('image')->store('categories', 'public');
        }

        $category->name = $validated['name'];
        $category->slug = $slug;
        $category->type = $validated['type'] ?? null;
        $category->sort_order = $validated['sort_order'] ?? ($category->sort_order ?? 0);
        $category->is_active = $validated['is_active'] ?? $category->is_active;
        $category->save();

        return response()->json(['data' => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'type' => $category->type,
            'sort_order' => (int)($category->sort_order ?? 0),
            'is_active' => (bool)$category->is_active,
            'image_url' => Media::url($category->image_path),
            'image_path' => $category->image_path,
        ]]);
    }

    public function destroy(Category $category)
    {
        if ($category->image_path) Storage::disk('public')->delete($category->image_path);
        $category->delete();
        return response()->json(['ok' => true]);
    }
}

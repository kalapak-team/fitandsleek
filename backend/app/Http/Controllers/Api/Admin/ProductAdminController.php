<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Message;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductAdminController extends Controller
{
    public function uploadGalleryImage(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|file|mimes:jpg,jpeg,png,webp,svg|max:5120',
        ]);

        $path = $request->file('image')->store('product-gallery', 'public');
        $url = Storage::disk('public')->url($path);

        return response()->json([
            'message' => 'Image uploaded',
            'image_url' => $url,
        ], 200);
    }
    public function index()
    {
        return Product::with(['category', 'brand', 'activeSale'])->orderByDesc('id')->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => ['required', 'integer'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'sku' => ['required', 'string', 'max:60'],
            'name' => ['required', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'model_info' => ['nullable', 'string'],
            'colors' => ['nullable', 'array'],
            'sizes' => ['nullable', 'array'],
            'size_guide' => ['nullable', 'string'],
            'delivery_info' => ['nullable', 'string'],
            'support_phone' => ['nullable', 'string'],
            'payment_methods' => ['nullable', 'array'],
            'gallery' => ['nullable', 'array'],
        ]);

        $data['slug'] = Str::slug($data['name']);
        // Ensure unique slug
        $baseSlug = $data['slug'];
        $i = 1;
        while (Product::where('slug', $data['slug'])->exists()) {
            $data['slug'] = $baseSlug . '-' . $i++;
        }

        // Ensure unique SKU
        $baseSku = $data['sku'];
        $skuIndex = 1;
        while (Product::where('sku', $data['sku'])->exists()) {
            $suffix = '-' . $skuIndex++;
            $data['sku'] = Str::limit($baseSku, 60 - strlen($suffix), '') . $suffix;
        }

        $product = Product::create($data);

        // Auto-create a customer/guest message for new products (EN + KM)
        try {
            $payload = [
                'title' => 'New Product: ' . $product->name,
                'content' => 'Just added: ' . $product->name,
                'target_audience' => 'all',
                'is_active' => true,
                'created_by' => $request->user()->id,
                'link_url' => url('/p/' . $product->slug),
                'media_url' => $product->image_url,
                'media_type' => $product->image_url ? 'image' : null,
            ];

            Message::create(array_merge($payload, ['language' => 'en']));
            Message::create(array_merge($payload, ['language' => 'km']));
        } catch (\Throwable $e) {
            // Ignore message creation failures
        }

        return response()->json($product, 201);
    }

    public function show(Product $product)
    {
        return $product->load(['category', 'brand', 'activeSale']);
    }

    public function update(Request $request, Product $product)
    {
        $data = $request->validate([
            'category_id' => ['sometimes', 'integer'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'sku' => ['sometimes', 'string', 'max:60'],
            'name' => ['sometimes', 'string', 'max:180'],
            'description' => ['nullable', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'image_url' => ['nullable', 'string'],
            'stock' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'model_info' => ['nullable', 'string'],
            'colors' => ['nullable', 'array'],
            'sizes' => ['nullable', 'array'],
            'size_guide' => ['nullable', 'string'],
            'delivery_info' => ['nullable', 'string'],
            'support_phone' => ['nullable', 'string'],
            'payment_methods' => ['nullable', 'array'],
            'gallery' => ['nullable', 'array'],
        ]);

        if (isset($data['name'])) $data['slug'] = Str::slug($data['name']);
        // Ensure unique slug on update
        if (isset($data['slug'])) {
            $baseSlug = $data['slug'];
            $i = 1;
            while (Product::where('slug', $data['slug'])->where('id', '!=', $product->id)->exists()) {
                $data['slug'] = $baseSlug . '-' . $i++;
            }
        }

        $product->update($data);
        return $product->load(['category', 'brand', 'activeSale']);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json(['message' => 'Deleted']);
    }
}

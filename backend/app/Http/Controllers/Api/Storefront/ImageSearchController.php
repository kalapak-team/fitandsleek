<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use App\Services\ImageSearchService;
use Throwable;

class ImageSearchController extends Controller
{
    public function search(Request $request, ImageSearchService $imageSearchService)
    {
        // Ensure this request isn't killed by the default 30s PHP limit while the model warms up.
        $desired = 180;
        @ini_set('max_execution_time', (string) $desired);
        if (function_exists('set_time_limit')) {
            @set_time_limit($desired);
        }
        @ini_set('default_socket_timeout', (string) max($desired, (int) ini_get('default_socket_timeout')));

        $validated = $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'limit' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $image = $request->file('image');
        $limit = (int) ($validated['limit'] ?? 12);

        try {
            $productIds = $imageSearchService->searchSimilarProductIds($image, $limit);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Image similarity search failed.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 502);
        }

        if (empty($productIds)) {
            return response()->json([
                'products' => [],
                'total' => 0,
                'match_reason' => 'qdrant_similarity',
            ]);
        }

        $products = Product::query()
            ->with(['category', 'brand', 'activeSale'])
            ->where('is_active', true)
            ->whereIn('id', $productIds)
            ->get();

        $rankedProducts = collect($productIds)
            ->map(function (int $id, int $index) use ($products) {
                $product = $products->firstWhere('id', $id);
                if (!$product) {
                    return null;
                }

                return [
                    'id' => $product->id,
                    'slug' => $product->slug,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => (float) $product->price,
                    'final_price' => (float) $product->final_price,
                    'discount_price' => $product->discount_price,
                    'discount_percentage' => $product->discount_percentage,
                    'has_discount' => (bool) $product->has_discount,
                    'image_url' => $product->image_url,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'slug' => $product->category->slug,
                    ] : null,
                    'brand' => $product->brand ? [
                        'id' => $product->brand->id,
                        'name' => $product->brand->name,
                        'slug' => $product->brand->slug,
                    ] : null,
                    'similarity_rank' => $index + 1,
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'match_reason' => 'qdrant_similarity',
            'products' => $rankedProducts,
            'total' => $rankedProducts->count(),
        ]);
    }
}

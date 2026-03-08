<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Services\ImageSearchService;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProductSearchController extends Controller
{
    public function __construct(private ImageSearchService $imageSearchService)
    {
    }

    public function searchByImage(Request $request)
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg|max:4096',
            'limit' => 'sometimes|integer|min:1|max:50',
        ]);

        /** @var UploadedFile $image */
        $image = $validated['image'];
        $limit = $validated['limit'] ?? 12;

        try {
            $productIds = $this->imageSearchService->searchSimilarProductIds($image, $limit);

            if (empty($productIds)) {
                return response()->json([
                    'success' => true,
                    'data' => [],
                ]);
            }

            $products = Product::query()
                ->whereIn('id', $productIds)
                ->orderByRaw('FIELD(id, ' . implode(',', $productIds) . ')')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        } catch (Throwable $e) {
            Log::warning('Image search failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Image search failed: ' . $e->getMessage(),
            ], 500);
        }
    }
}

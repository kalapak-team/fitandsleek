<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\Product;
use Illuminate\Http\Request;

class SaleAdminController extends Controller
{
    /**
     * Get all sales with pagination and filtering
     */
    public function index(Request $request)
    {
        $query = Sale::query();

        // Filter by product
        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        // Filter by active status
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Filter by date range
        if ($request->has('start_date')) {
            $query->whereDate('start_date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->whereDate('end_date', '<=', $request->end_date);
        }

        // Search by product name
        if ($request->has('search')) {
            $query->whereHas('product', function ($q) {
                $q->where('name', 'like', '%' . request('search') . '%');
            });
        }

        $sales = $query->with('product')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json($sales);
    }

    /**
     * Get a single sale
     */
    public function show($id)
    {
        $sale = Sale::with('product')->findOrFail($id);
        return response()->json($sale);
    }

    /**
     * Create a new sale
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'discount_type' => 'required|in:percentage,fixed',
            'discount_value' => 'required|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'is_active' => 'boolean',
            'description' => 'nullable|string|max:500',
        ]);

        // Calculate sale_price if not provided
        if (empty($validated['sale_price'])) {
            $product = Product::findOrFail($validated['product_id']);
            if ($validated['discount_type'] === 'percentage') {
                $validated['sale_price'] = $product->price * (1 - $validated['discount_value'] / 100);
            } else {
                $validated['sale_price'] = max(0, $product->price - $validated['discount_value']);
            }
        }

        $sale = Sale::create($validated);

        return response()->json([
            'message' => 'Sale created successfully',
            'data' => $sale->load('product')
        ], 201);
    }

    /**
     * Update a sale
     */
    public function update(Request $request, $id)
    {
        $sale = Sale::findOrFail($id);

        $validated = $request->validate([
            'product_id' => 'sometimes|exists:products,id',
            'discount_type' => 'sometimes|in:percentage,fixed',
            'discount_value' => 'sometimes|numeric|min:0',
            'sale_price' => 'nullable|numeric|min:0',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'is_active' => 'boolean',
            'description' => 'nullable|string|max:500',
        ]);

        // Recalculate sale_price if discount changed
        if (isset($validated['discount_value']) || isset($validated['discount_type'])) {
            if (empty($validated['sale_price'])) {
                $product = Product::findOrFail($validated['product_id'] ?? $sale->product_id);
                $discountType = $validated['discount_type'] ?? $sale->discount_type;
                $discountValue = $validated['discount_value'] ?? $sale->discount_value;

                if ($discountType === 'percentage') {
                    $validated['sale_price'] = $product->price * (1 - $discountValue / 100);
                } else {
                    $validated['sale_price'] = max(0, $product->price - $discountValue);
                }
            }
        }

        $sale->update($validated);

        return response()->json([
            'message' => 'Sale updated successfully',
            'data' => $sale->load('product')
        ]);
    }

    /**
     * Delete a sale
     */
    public function destroy($id)
    {
        $sale = Sale::findOrFail($id);
        $sale->delete();

        return response()->json([
            'message' => 'Sale deleted successfully'
        ]);
    }

    /**
     * Get active sales (for storefront)
     */
    public function getActiveSales()
    {
        $sales = Sale::where('is_active', true)
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with('product')
            ->get();

        return response()->json($sales);
    }

    /**
     * Bulk toggle active status
     */
    public function bulkToggle(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sales,id',
            'is_active' => 'required|boolean',
        ]);

        Sale::whereIn('id', $validated['ids'])->update(['is_active' => $validated['is_active']]);

        return response()->json([
            'message' => 'Sales updated successfully',
            'count' => count($validated['ids'])
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CartController extends Controller
{
    private function resolveUnitPrice(Product $product): float
    {
        return (float) ($product->final_price ?? $product->price ?? 0);
    }

    private function userCartId(int $userId): int
    {
        $cart = Cart::firstOrCreate(
            ['user_id' => $userId],
            ['status' => 'active']
        );

        return (int) $cart->id;
    }

    public function show(Request $request)
    {
        $userId = (int) $request->user()->id;
        $cartId = $this->userCartId($userId);

        $cart = Cart::with(['items.product.category', 'items.product.activeSale'])->findOrFail($cartId);

        $total = 0;
        foreach ($cart->items as $i) {
            if ($i->product) {
                $i->unit_price = $this->resolveUnitPrice($i->product);
            }
            $total += (float) $i->unit_price * (int) $i->quantity;
        }

        return response()->json([
            'cart' => $cart,
            'total' => round($total, 2),
        ]);
    }

    public function addItem(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer'],
            'quantity' => ['nullable', 'integer', 'min:1'],
            'size' => ['nullable', 'string', 'max:40'],
            'color' => ['nullable', 'string', 'max:40'],
        ]);

        $userId = (int) $request->user()->id;
        $cartId = $this->userCartId($userId);

        $product = Product::findOrFail((int) $data['product_id']);
        $qty = (int) ($data['quantity'] ?? 1);
        $size = $data['size'] ?? null;
        $color = $data['color'] ?? null;

        if (is_numeric($product->stock)) {
            $stock = (int) $product->stock;
            $existingTotal = CartItem::where('cart_id', $cartId)
                ->where('product_id', $product->id)
                ->sum('quantity');
            if ($existingTotal + $qty > $stock) {
                return response()->json([
                    'message' => 'Stock limit reached for this product.',
                ], 422);
            }
        }

        DB::transaction(function () use ($cartId, $product, $qty, $size, $color) {
            $unitPrice = $this->resolveUnitPrice($product);

            /** @var \App\Models\CartItem|null $item */
            $item = CartItem::where('cart_id', $cartId)
                ->where('product_id', $product->id)
                ->when($size !== null, fn ($q) => $q->where('size', $size))
                ->when($size === null, fn ($q) => $q->whereNull('size'))
                ->when($color !== null, fn ($q) => $q->where('color', $color))
                ->when($color === null, fn ($q) => $q->whereNull('color'))
                ->first();

            if ($item) {
                $item->quantity += $qty;
                $item->unit_price = $unitPrice;
                $item->save();
                return;
            }

            CartItem::create([
                'cart_id' => $cartId,
                'product_id' => $product->id,
                'color' => $color,
                'size' => $size,
                'quantity' => $qty,
                'unit_price' => $unitPrice,
            ]);
        });

        return $this->show($request);
    }

    public function updateItem(Request $request, int $itemId)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $userId = (int) $request->user()->id;
        $cartId = $this->userCartId($userId);

        $item = CartItem::where('id', $itemId)->where('cart_id', $cartId)->firstOrFail();
        $product = Product::find($item->product_id);
        $newQty = (int) $data['quantity'];
        if ($product && is_numeric($product->stock)) {
            $stock = (int) $product->stock;
            $otherQty = CartItem::where('cart_id', $cartId)
                ->where('product_id', $item->product_id)
                ->where('id', '!=', $item->id)
                ->sum('quantity');
            if ($otherQty + $newQty > $stock) {
                return response()->json([
                    'message' => 'Stock limit reached for this product.',
                ], 422);
            }
        }

        $item->quantity = $newQty;
        if ($product) {
            $item->unit_price = $this->resolveUnitPrice($product);
        }
        $item->save();

        return $this->show($request);
    }

    public function removeItem(Request $request, int $itemId)
    {
        $userId = (int) $request->user()->id;
        $cartId = $this->userCartId($userId);

        CartItem::where('id', $itemId)->where('cart_id', $cartId)->delete();

        return $this->show($request);
    }
}

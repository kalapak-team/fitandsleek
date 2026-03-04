<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;

class OrderAdminController extends Controller
{
    public function index()
    {
        return Order::with(['user', 'items.product'])
            ->orderByDesc('id')
            ->paginate(20);
    }

    public function show(Order $order)
    {
        return $order->load(['user', 'items.product.category']);
    }

    public function update(Request $request, Order $order)
    {
        $data = $request->validate([
            'status' => ['required', 'string', 'max:50'],
        ]);

        $order->update(['status' => $data['status']]);

        return $order->fresh()->load(['user', 'items.product.category']);
    }

    public function destroy(Order $order)
    {
        $order->items()->delete();
        $order->payments()->delete();
        if ($order->shipment) {
            $order->shipment()->delete();
        }
        $order->replacementCases()->delete();
        $order->delete();

        return response()->json(['message' => 'Order deleted']);
    }
}

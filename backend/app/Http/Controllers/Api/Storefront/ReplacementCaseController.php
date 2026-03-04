<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\ReplacementCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReplacementCaseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $cases = ReplacementCase::query()
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id))
            ->with(['order.items.product'])
            ->orderByDesc('id')
            ->paginate($request->get('per_page', 10));

        return response()->json(["data" => $cases]);
    }

    public function byOrder(Request $request, int $orderId): JsonResponse
    {
        $user = $request->user();

        $cases = ReplacementCase::query()
            ->where('order_id', $orderId)
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id))
            ->with(['order.items.product'])
            ->orderByDesc('id')
            ->get();

        return response()->json(["data" => $cases]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'reason' => ['required', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $order = Order::with('user')->findOrFail($validated['order_id']);
        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $case = ReplacementCase::create([
            'order_id' => $validated['order_id'],
            'reason' => $validated['reason'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Replacement case submitted',
            'data' => $case,
        ], 201);
    }
}

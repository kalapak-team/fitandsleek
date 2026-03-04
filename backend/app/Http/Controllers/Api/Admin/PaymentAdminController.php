<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Payment;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentAdminController extends BaseAdminController
{
    /**
     * Get all payments with filters
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['order.user', 'verifiedBy']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by method
        if ($request->has('method')) {
            $query->where('method', $request->input('method'));
        }

        // Filter by order
        if ($request->has('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        // Date range filter
        if ($request->has('from_date') && $request->has('to_date')) {
            $query->whereBetween('created_at', [$request->from_date, $request->to_date]);
        }

        $payments = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'message' => 'Payments retrieved successfully',
            'data' => $payments,
        ]);
    }

    /**
     * Get single payment details
     */
    public function show(Payment $payment): JsonResponse
    {
        // Admins can only view payments for customer orders
        /** @var \App\Models\User|null $authUser */
        $authUser = auth()->guard('sanctum')->user();
        if ($authUser && $authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            if ($payment->order && !$payment->order->user->isCustomer()) {
                return response()->json([
                    'message' => 'Unauthorized to view this payment',
                ], 403);
            }
        }

        $payment->load(['order.user', 'verifiedBy']);

        return response()->json([
            'message' => 'Payment retrieved successfully',
            'data' => $payment,
        ]);
    }

    /**
     * Verify payment (mark as success)
     */
    public function verify(Request $request, Payment $payment): JsonResponse
    {
        // Admins can only verify payments for customer orders
        /** @var \App\Models\User|null $authUser */
        $authUser = auth()->guard('sanctum')->user();
        if ($authUser && $authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            if ($payment->order && !$payment->order->user->isCustomer()) {
                return response()->json([
                    'message' => 'Unauthorized to verify this payment',
                ], 403);
            }
        }

        $validated = $request->validate([
            'verified_at' => 'nullable|date',
            'reference_code' => 'nullable|string|max:100',
        ]);

        $payment->update([
            'status' => 'success',
            'verified_by' => auth()->guard('sanctum')->user()->id,
            'verified_at' => $validated['verified_at'] ?? now(),
            'reference_code' => $validated['reference_code'] ?? 'Verified by admin',
        ]);

        return response()->json([
            'message' => 'Payment verified successfully',
            'data' => $payment,
        ]);
    }

    /**
     * Reject payment
     */
    public function reject(Request $request, Payment $payment): JsonResponse
    {
        // Admins can only reject payments for customer orders
        /** @var \App\Models\User|null $authUser */
        $authUser = auth()->guard('sanctum')->user();
        if ($authUser && $authUser->isAdmin() && !$authUser->isSuperAdmin()) {
            if ($payment->order && !$payment->order->user->isCustomer()) {
                return response()->json([
                    'message' => 'Unauthorized to reject this payment',
                ], 403);
            }
        }

        $validated = $request->validate([
            'notes' => 'nullable|string|max:500',
        ]);

        $payment->update(['status' => 'failed']);

        return response()->json([
            'message' => 'Payment rejected',
            'data' => $payment,
        ]);
    }

    /**
     * Get payment statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'total_pending' => Payment::where('status', 'pending')->count(),
            'total_success' => Payment::where('status', 'success')->count(),
            'total_failed' => Payment::where('status', 'failed')->count(),
            'pending_amount' => Payment::where('status', 'pending')
                ->join('orders', 'payments.order_id', '=', 'orders.id')
                ->sum('orders.total'),
            'verified_amount' => Payment::where('status', 'success')
                ->join('orders', 'payments.order_id', '=', 'orders.id')
                ->sum('orders.total'),
        ];

        return response()->json([
            'message' => 'Payment statistics retrieved',
            'data' => $stats,
        ]);
    }
}

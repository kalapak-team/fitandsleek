<?php

namespace App\Http\Controllers\Api\Driver;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use App\Models\ShipmentTrackingEvent;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentDriverController extends Controller
{
    public function scan(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'driver') {
            return response()->json(['message' => 'Forbidden (driver only).'], 403);
        }

        $validated = $request->validate([
            'shipment_id' => 'nullable|integer|exists:shipments,id',
            'tracking_code' => 'nullable|string',
            'code' => 'nullable|string',
            'location' => 'nullable|string|max:255',
            'note' => 'nullable|string',
        ]);

        $trackingCode = $validated['tracking_code'] ?? $validated['code'] ?? null;

        if (empty($validated['shipment_id']) && empty($trackingCode)) {
            return response()->json([
                'message' => 'Either shipment_id or tracking code is required.',
            ], 422);
        }

        if (! empty($validated['shipment_id'])) {
            $shipment = Shipment::findOrFail($validated['shipment_id']);
        } else {
            $shipment = Shipment::where('tracking_code', $trackingCode)->first();
            if (! $shipment) {
                return response()->json(['message' => 'Shipment not found for this tracking code.'], 404);
            }
        }

        if (! empty($trackingCode) && $trackingCode !== $shipment->tracking_code) {
            return response()->json([
                'message' => 'Tracking code does not match shipment.',
            ], 422);
        }

        $fromStatus = $shipment->status;
        $nextStatus = null;

        if (in_array($fromStatus, ['pending', 'processing', 'failed', 'returned'], true)) {
            $nextStatus = 'shipped';
            if (! $shipment->shipped_at) {
                $shipment->shipped_at = now();
            }
        } elseif (in_array($fromStatus, ['shipped', 'in_transit'], true)) {
            $nextStatus = 'delivered';
            if (! $shipment->delivered_at) {
                $shipment->delivered_at = now();
            }
        } else {
            return response()->json([
                'message' => 'Shipment already delivered.',
                'data' => [
                    'shipment_id' => $shipment->id,
                    'status' => $shipment->status,
                    'tracking_code' => $shipment->tracking_code,
                    'tracking_url' => $shipment->tracking_url,
                ],
            ], 200);
        }

        $shipment->status = $nextStatus;
        $shipment->save();

        ShipmentTrackingEvent::create([
            'shipment_id' => $shipment->id,
            'status' => $nextStatus,
            'location' => $validated['location'] ?? null,
            'note' => $validated['note'] ?? null,
            'updated_by' => $user->id,
            'event_time' => now(),
        ]);

        return response()->json([
            'message' => 'Shipment scan processed.',
            'data' => [
                'shipment_id' => $shipment->id,
                'from_status' => $fromStatus,
                'status' => $shipment->status,
                'tracking_code' => $shipment->tracking_code,
                'tracking_url' => $shipment->tracking_url,
            ],
        ]);
    }

    public function receipt(Request $request, InvoiceService $invoiceService): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'driver') {
            return response()->json(['message' => 'Forbidden (driver only).'], 403);
        }

        $validated = $request->validate([
            'shipment_id' => 'nullable|integer|exists:shipments,id',
            'tracking_code' => 'nullable|string',
            'code' => 'nullable|string',
        ]);

        $trackingCode = $validated['tracking_code'] ?? $validated['code'] ?? null;

        if (empty($validated['shipment_id']) && empty($trackingCode)) {
            return response()->json([
                'message' => 'Either shipment_id or tracking code is required.',
            ], 422);
        }

        if (! empty($validated['shipment_id'])) {
            $shipment = Shipment::with('order')->findOrFail($validated['shipment_id']);
        } else {
            $shipment = Shipment::with('order')
                ->where('tracking_code', $trackingCode)
                ->first();
            if (! $shipment) {
                return response()->json(['message' => 'Shipment not found for this tracking code.'], 404);
            }
        }

        if (! $shipment->order) {
            return response()->json(['message' => 'Order not found for shipment.'], 404);
        }

        $invoice = $invoiceService->buildOrderInvoiceData($shipment->order);

        return response()->json([
            'message' => 'Driver receipt retrieved successfully.',
            'data' => [
                'invoice_number' => $invoice['invoice_number'],
                'invoice_date' => $invoice['invoice_date'],
                'payment_status' => $invoice['payment_status'],
                'items' => array_map(function ($item) {
                    return [
                        'product_name' => $item['product_name'],
                        'quantity' => $item['quantity'],
                        'price' => $item['price'],
                        'line_total' => $item['line_total'],
                    ];
                }, $invoice['items']),
                'grand_total' => $invoice['grand_total'],
                'tracking_code' => $invoice['tracking_code'],
            ],
        ]);
    }

    public function updateStatus(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'driver') {
            return response()->json(['message' => 'Forbidden (driver only).'], 403);
        }

        $validated = $request->validate([
            'shipment_id' => 'required|integer|exists:shipments,id',
            'status' => 'required|in:shipped,delivered',
            'location' => 'nullable|string|max:255',
            'note' => 'nullable|string',
        ]);

        $shipment = Shipment::with('order')->findOrFail($validated['shipment_id']);
        $status = $validated['status'];

        if ($status === 'shipped' && ! $shipment->shipped_at) {
            $shipment->shipped_at = now();
        }
        if ($status === 'delivered' && ! $shipment->delivered_at) {
            $shipment->delivered_at = now();
        }

        $shipment->status = $status;
        $shipment->save();

        ShipmentTrackingEvent::create([
            'shipment_id' => $shipment->id,
            'status' => $status,
            'location' => $validated['location'] ?? null,
            'note' => $validated['note'] ?? null,
            'updated_by' => $user->id,
            'event_time' => now(),
        ]);

        return response()->json([
            'message' => 'Shipment status updated',
            'data' => [
                'shipment_id' => $shipment->id,
                'status' => $shipment->status,
                'tracking_code' => $shipment->tracking_code,
                'tracking_url' => $shipment->tracking_url,
            ],
        ]);
    }
}

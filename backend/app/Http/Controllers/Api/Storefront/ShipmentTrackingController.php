<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShipmentTrackingController extends Controller
{
    public function track(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'shipment_id' => 'required|integer',
            'tracking_code' => 'required|string',
        ]);

        $shipment = Shipment::with(['order', 'trackingEvents'])
            ->where('id', $validated['shipment_id'])
            ->where('tracking_code', $validated['tracking_code'])
            ->first();

        if (! $shipment) {
            return response()->json(['message' => 'Shipment not found'], 404);
        }

        return response()->json([
            'message' => 'Shipment retrieved',
            'data' => [
                'shipment_id' => $shipment->id,
                'status' => $shipment->status,
                'provider' => $shipment->provider,
                'tracking_code' => $shipment->tracking_code,
                'tracking_url' => $shipment->tracking_url,
                'shipped_at' => $shipment->shipped_at,
                'delivered_at' => $shipment->delivered_at,
                'order_id' => $shipment->order?->id,
                'tracking_events' => $shipment->trackingEvents
                    ->sortByDesc('event_time')
                    ->values()
                    ->map(function ($event) {
                        return [
                            'id' => $event->id,
                            'status' => $event->status,
                            'location' => $event->location,
                            'note' => $event->note,
                            'event_time' => $event->event_time,
                        ];
                    }),
            ],
        ]);
    }
}

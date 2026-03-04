<?php

namespace App\Observers;

use App\Models\Shipment;

class ShipmentObserver
{
    public function updated(Shipment $shipment): void
    {
        if (! $shipment->isDirty('status')) {
            return;
        }

        if ($shipment->status !== 'delivered') {
            return;
        }

        if (! $shipment->order) {
            return;
        }

        if ($shipment->order->status === 'completed') {
            return;
        }

        $shipment->order->update(['status' => 'completed']);
    }
}

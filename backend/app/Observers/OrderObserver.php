<?php

namespace App\Observers;

use App\Mail\PaymentSuccessMail;
use App\Models\Order;
use App\Models\Shipment;
use App\Models\ShipmentTrackingEvent;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OrderObserver
{
    public function updated(Order $order): void
    {
        $statusPaid = $order->isDirty('status') && $order->status === 'paid';
        $paymentPaid = $order->isDirty('payment_status') && $order->payment_status === 'paid';

        if (! $statusPaid && ! $paymentPaid) {
            return;
        }

        if ($order->shipment) {
            return;
        }

        $trackingCode = $this->generateTrackingCode();

        $shipment = Shipment::create([
            'order_id' => $order->id,
            'provider' => 'Internal',
            'tracking_code' => $trackingCode,
            'status' => 'pending',
        ]);

        ShipmentTrackingEvent::create([
            'shipment_id' => $shipment->id,
            'status' => 'pending',
            'note' => 'Order confirmed. Preparing for shipment.',
            'event_time' => now(),
        ]);

        if ($paymentPaid) {
            $this->sendPaymentSuccessEmails($order);
        }
    }

    private function sendPaymentSuccessEmails(Order $order): void
    {
        $order->loadMissing(['user', 'payments']);

        $customerEmail = trim((string) ($order->user?->email ?? ''));

        $adminEmails = User::query()
            ->whereIn('role', ['admin', 'superadmin'])
            ->whereNotNull('email')
            ->pluck('email')
            ->map(fn ($email) => trim((string) $email))
            ->filter(fn ($email) => filter_var($email, FILTER_VALIDATE_EMAIL))
            ->values();

        $fallbackAdmin = trim((string) config('mail.admin_address'));
        if ($fallbackAdmin !== '' && filter_var($fallbackAdmin, FILTER_VALIDATE_EMAIL)) {
            $adminEmails->push($fallbackAdmin);
        }

        $adminEmails = $adminEmails
            ->reject(fn ($email) => strcasecmp($email, $customerEmail) === 0)
            ->unique()
            ->values();

        try {
            if ($customerEmail !== '' && filter_var($customerEmail, FILTER_VALIDATE_EMAIL)) {
                Mail::to($customerEmail)->send(new PaymentSuccessMail($order, 'customer'));
            }

            foreach ($adminEmails as $adminEmail) {
                Mail::to($adminEmail)->send(new PaymentSuccessMail($order, 'admin'));
            }
        } catch (\Throwable $e) {
            Log::error('Failed sending payment success emails', [
                'order_id' => $order->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function generateTrackingCode(): string
    {
        do {
            $code = 'FS-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(6));
        } while (Shipment::where('tracking_code', $code)->exists());

        return $code;
    }
}

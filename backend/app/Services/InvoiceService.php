<?php

namespace App\Services;

use App\Models\Order;

class InvoiceService
{
    public function buildOrderInvoiceData(Order $order): array
    {
        $order->loadMissing(['user', 'items.product', 'shipment']);

        $shippingAddress = is_array($order->shipping_address) ? $order->shipping_address : [];

        $addressParts = array_filter([
            $shippingAddress['street'] ?? null,
            $shippingAddress['line1'] ?? null,
            $shippingAddress['line2'] ?? null,
            $shippingAddress['city'] ?? null,
            $shippingAddress['state'] ?? null,
            $shippingAddress['postal_code'] ?? null,
            $shippingAddress['country'] ?? null,
            $shippingAddress['full_address'] ?? null,
            $shippingAddress['address'] ?? null,
        ]);

        $fullAddress = implode(', ', $addressParts);

        $subtotal = (float) ($order->subtotal ?? 0);
        $discount = (float) ($order->discount ?? 0);
        $shipping = (float) ($order->shipping ?? 0);
        $total = (float) ($order->total ?? 0);

        $items = [];
        $itemCount = max(1, $order->items->count());

        foreach ($order->items as $index => $item) {
            $qty = (int) ($item->qty ?? 0);
            $price = (float) ($item->price ?? 0);
            $lineBase = (float) ($item->line_total ?? ($qty * $price));

            $discountShare = $subtotal > 0 ? round($discount * ($lineBase / $subtotal), 2) : round($discount / $itemCount, 2);
            $shippingShare = $index === 0 ? $shipping : 0;
            $grandTotal = max(0, round($lineBase - $discountShare + $shippingShare, 2));

            $items[] = [
                'product_name' => $item->name ?: ($item->product->name ?? 'Item'),
                'sku' => $item->sku ?: ($item->product->sku ?? '-'),
                'quantity' => $qty,
                'price' => round($price, 2),
                'line_total' => round($lineBase, 2),
                'discount' => $discountShare,
                'shipping_fee' => $shippingShare,
                'grand_total' => $grandTotal,
            ];
        }

        $trackingCode = $order->shipment?->tracking_code;
        $shipmentId = $order->shipment?->id;
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');
        $queryParts = [];
        if ($shipmentId) {
            $queryParts[] = 'shipment_id=' . urlencode((string) $shipmentId);
        }
        if ($trackingCode) {
            $queryParts[] = 'tracking_code=' . urlencode((string) $trackingCode);
        }
        $scanUrl = !empty($queryParts)
            ? $frontendUrl . '/driver/scan?' . implode('&', $queryParts)
            : null;

        $qrPayload = !empty($queryParts)
            ? json_encode([
                'shipment_id' => $shipmentId ? (string) $shipmentId : null,
                'tracking_code' => $trackingCode ?: null,
                'scan_url' => $scanUrl,
            ], JSON_UNESCAPED_SLASHES)
            : null;

        $paymentStatusRaw = strtolower((string) ($order->payment_status ?: $order->status));
        $isPaid = in_array($paymentStatusRaw, ['paid', 'completed', 'success', 'succeeded'], true);

        return [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'invoice_number' => 'INV-' . ($order->order_number ?: str_pad((string) $order->id, 6, '0', STR_PAD_LEFT)),
            'invoice_date' => $order->created_at?->format('Y-m-d H:i') ?? now()->format('Y-m-d H:i'),
            'customer' => [
                'name' => $shippingAddress['name'] ?? $order->user?->name ?? 'Guest',
                'phone' => $shippingAddress['phone'] ?? $order->user?->phone ?? '-',
                'full_address' => $fullAddress ?: '-',
                'email' => $order->user?->email,
            ],
            'items' => $items,
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'shipping_fee' => round($shipping, 2),
            'grand_total' => round($total, 2),
            'payment_status' => $isPaid ? 'PAID' : 'UNPAID',
            'payment_status_raw' => $order->payment_status ?: $order->status,
            'shipment_id' => $shipmentId,
            'tracking_code' => $trackingCode,
            'driver_scan_url' => $scanUrl,
            'qr_payload' => $qrPayload,
        ];
    }
}

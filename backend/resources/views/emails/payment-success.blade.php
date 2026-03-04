@php
    $isAdmin = ($recipientType ?? 'customer') === 'admin';
    $customerName = $order->user->name ?? 'Customer';
    $payment = $order->payments->sortByDesc('id')->first();
    $method = $payment?->method ?? $order->payment_method ?? 'payment';
@endphp

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
    <h2 style="margin-bottom: 12px;">
        {{ $isAdmin ? 'Payment Finalization & Communication (Admin Alert)' : 'Payment Finalization & Communication' }}
    </h2>

    @if($isAdmin)
        <p>A payment has been completed successfully.</p>
        <p><strong>Customer:</strong> {{ $customerName }} ({{ $order->user->email ?? 'N/A' }})</p>
    @else
        <p>Hi {{ $customerName }},</p>
        <p>Your payment has been received successfully. Your order is now being processed.</p>
    @endif

    <p><strong>Order Number:</strong> {{ $order->order_number }}</p>
    <p><strong>Payment Method:</strong> {{ strtoupper(str_replace('_', ' ', (string) $method)) }}</p>
    <p><strong>Total:</strong> {{ $payment?->currency ?? 'USD' }} {{ number_format((float) $order->total, 2) }}</p>
    <p><strong>Status:</strong> {{ strtoupper((string) $order->payment_status) }}</p>

    @if(!$isAdmin)
        <p>Thank you for shopping with us.</p>
    @endif

    <p style="margin-top: 20px; color: #6b7280; font-size: 13px;">
        Fit and Sleek Team
    </p>
</body>
</html>

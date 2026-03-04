<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;
use RuntimeException;

class BakongKhqrService
{
    public function __construct(private readonly KhqrNode $generator)
    {
    }

    public function generate(Order $order, Payment $payment): array
    {
        $accountId = config('services.bakong.receive_account');

        if (! $accountId) {
            throw new RuntimeException('Bakong receive account is not configured.');
        }

        $currency = strtoupper($payment->currency ?: config('services.bakong.currency', 'KHR'));
        $amount = (float) ($payment->amount ?: $order->total ?: 0);
        $billNumber = $payment->bill_number ?: $this->makeBillNumber($order);
        $billNumber = $this->ensureUniqueBillNumber($billNumber, $payment->id);

        $expiresAt = now()->addSeconds(config('services.bakong.expired_in', 300));

        $payload = [
            'accountID' => $accountId,
            'merchantName' => config('services.bakong.merchant_name', 'Fitandsleek Clothes Store'),
            'merchantCity' => config('services.bakong.merchant_city', 'Phnom Penh'),
            'currency' => $currency,
            'amount' => $amount,
            'billNumber' => $billNumber,
            'storeLabel' => 'FitandSleek',
            'terminalLabel' => 'FitandSleekWeb',
            'expirationTimestamp' => $expiresAt->getTimestampMs(),
        ];

        $result = $this->generator->generate($payload);

        return [
            'bill_number' => $billNumber,
            'qr_string' => $result['qr'],
            'md5' => $result['md5'],
            'expires_at' => $expiresAt,
            'payload' => $payload,
        ];
    }

    private function makeBillNumber(Order $order): string
    {
        if ($order->order_number) {
            return $order->order_number;
        }

        return 'FS-' . now()->format('Ymd') . '-' . Str::upper(Str::random(6));
    }

    private function ensureUniqueBillNumber(string $base, ?int $paymentId = null): string
    {
        $candidate = $base;

        while (
            Payment::where('bill_number', $candidate)
                ->when($paymentId, fn ($q) => $q->where('id', '!=', $paymentId))
                ->exists()
        ) {
            $candidate = $base . '-' . Str::upper(Str::random(3));
        }

        return $candidate;
    }
}

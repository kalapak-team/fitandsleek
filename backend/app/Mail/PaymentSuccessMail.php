<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PaymentSuccessMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Order $order,
        public readonly string $recipientType = 'customer'
    ) {
    }

    public function build(): self
    {
        $subject = $this->recipientType === 'admin'
            ? 'New payment received - Order ' . $this->order->order_number
            : 'Payment confirmed - Order ' . $this->order->order_number;

        return $this->subject($subject)
            ->view('emails.payment-success');
    }
}

<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class NewDeviceLoginAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public array $context)
    {
    }

    public function build()
    {
        return $this->subject('New device login alert')
            ->view('emails.new-device-login-alert', [
                'time' => $this->context['time'] ?? '-',
                'device' => $this->context['device_name'] ?? '-',
                'browser' => $this->context['browser'] ?? '-',
                'os' => $this->context['os'] ?? '-',
                'ip' => $this->context['ip_address'] ?? '-',
            ]);
    }
}

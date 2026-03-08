<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\ConnectionException;
use RuntimeException;

class BakongApi
{
    public function checkByMd5(string $md5): array
    {
        $baseUrl = rtrim(config('services.bakong.base_url'), '/');
        $token = config('services.bakong.token');
        $userAgent = config('services.bakong.user_agent', 'fitandsleek/1.0');

        if (!$token) {
            throw new RuntimeException('Bakong token is not configured.');
        }

        if (empty($md5)) {
            throw new RuntimeException('Payment MD5 is missing.');
        }

        $http = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/json',
            'User-Agent' => $userAgent,
            'Accept' => 'application/json',
        ]);

        $verify = filter_var(config('services.bakong.verify', true), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
        $verify = $verify ?? true;
        $caBundle = config('services.bakong.ca_bundle');

        if ($verify === false) {
            $http = $http->withOptions(['verify' => false]);
        } elseif (!empty($caBundle)) {
            $http = $http->withOptions(['verify' => $caBundle]);
        }

        try {
            $response = $http->post($baseUrl . '/v1/check_transaction_by_md5', [
                'md5' => $md5,
            ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Bakong connection failed: ' . $e->getMessage(), 0, $e);
        }

        if ($response->failed()) {
            throw new RuntimeException('Bakong HTTP ' . $response->status() . ': ' . $response->body());
        }

        return $response->json();
    }
}

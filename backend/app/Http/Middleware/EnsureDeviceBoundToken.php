<?php

namespace App\Http\Middleware;

use App\Services\DeviceSessionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureDeviceBoundToken
{
    public function __construct(private DeviceSessionService $deviceSessionService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $token = $user?->currentAccessToken();

        if (! $user || ! $token) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $session = $this->deviceSessionService->validateCurrentTokenBinding($request, $user, $token);

        if (! $session) {
            return response()->json([
                'message' => 'Device verification failed. Please login again on this device.',
            ], 401);
        }

        return $next($request);
    }
}

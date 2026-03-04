<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserDeviceSession;
use App\Services\DeviceSessionService;
use Illuminate\Http\Request;

class AuthSessionController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $currentTokenId = $user?->currentAccessToken()?->id;

        $sessions = UserDeviceSession::query()
            ->where('user_id', $user->id)
            ->orderByDesc('last_used_at')
            ->orderByDesc('last_login_at')
            ->get()
            ->map(function (UserDeviceSession $session) use ($currentTokenId) {
                return [
                    'id' => $session->id,
                    'device_id' => $session->device_id,
                    'device_name' => $session->device_name,
                    'browser' => $session->browser,
                    'os' => $session->os,
                    'ip_address' => $session->ip_address,
                    'last_login_at' => optional($session->last_login_at)?->toDateTimeString(),
                    'last_used_at' => optional($session->last_used_at)?->toDateTimeString(),
                    'created_at' => optional($session->created_at)?->toDateTimeString(),
                    'is_current' => (int) $session->personal_access_token_id === (int) $currentTokenId,
                ];
            })
            ->values();

        return response()->json([
            'message' => 'Active sessions retrieved',
            'data' => $sessions,
        ]);
    }

    public function destroy(Request $request, UserDeviceSession $session, DeviceSessionService $deviceSessionService)
    {
        $user = $request->user();

        if ((int) $session->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $currentTokenId = $user?->currentAccessToken()?->id;
        $isCurrent = (int) $session->personal_access_token_id === (int) $currentTokenId;

        $deviceSessionService->revokeSession($session);

        return response()->json([
            'message' => $isCurrent ? 'Current session revoked. Please login again.' : 'Session revoked successfully.',
            'current_session_revoked' => $isCurrent,
        ]);
    }
}

<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserDeviceSession;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class DeviceSessionService
{
    private function findSessionForToken(User $user, PersonalAccessToken $token): ?UserDeviceSession
    {
        return UserDeviceSession::query()
            ->where('user_id', $user->id)
            ->where('personal_access_token_id', $token->id)
            ->first();
    }

    private function canMigrateToFrontendDeviceId(Request $request, array $context, ?UserDeviceSession $existingSession): bool
    {
        if (!$existingSession) {
            return false;
        }

        $hasExplicitDeviceHeader = (string) $request->header('X-Device-ID', '') !== '';
        $incomingDeviceId = (string) ($context['device_id'] ?? '');

        $incomingLooksFrontendId = str_starts_with($incomingDeviceId, 'dev_');
        $existingLooksFallbackId = !str_starts_with((string) $existingSession->device_id, 'dev_');

        return $hasExplicitDeviceHeader && $incomingLooksFrontendId && $existingLooksFallbackId;
    }

    private function migrateSessionDevice(UserDeviceSession $session, array $context): UserDeviceSession
    {
        $session->update([
            'device_id' => (string) $context['device_id'],
            'last_used_at' => now(),
            'last_login_at' => $session->last_login_at ?: now(),
            'ip_address' => $context['ip_address'],
            'user_agent' => $context['user_agent'],
            'device_name' => $context['device_name'] ?: $session->device_name,
            'browser' => $context['browser'] ?: $session->browser,
            'os' => $context['os'] ?: $session->os,
        ]);

        return $session->fresh();
    }

    public function resolveDeviceContext(Request $request): array
    {
        $deviceId = (string) ($request->header('X-Device-ID') ?: '');
        if ($deviceId === '') {
            $deviceId = sha1(($request->userAgent() ?: 'unknown').($request->ip() ?: '0.0.0.0'));
        }

        return [
            'device_id' => substr($deviceId, 0, 120),
            'device_name' => substr((string) $request->header('X-Device-Name', ''), 0, 190) ?: null,
            'browser' => substr((string) $request->header('X-Device-Browser', ''), 0, 120) ?: null,
            'os' => substr((string) $request->header('X-Device-OS', ''), 0, 120) ?: null,
            'user_agent' => $request->userAgent(),
            'ip_address' => $request->ip(),
        ];
    }

    public function bindTokenToDevice(User $user, PersonalAccessToken $token, Request $request): array
    {
        $context = $this->resolveDeviceContext($request);

        $knownDevice = UserDeviceSession::query()
            ->where('user_id', $user->id)
            ->where('device_id', $context['device_id'])
            ->exists();

        $session = UserDeviceSession::updateOrCreate(
            ['personal_access_token_id' => $token->id],
            [
                'user_id' => $user->id,
                'device_id' => $context['device_id'],
                'device_name' => $context['device_name'],
                'browser' => $context['browser'],
                'os' => $context['os'],
                'user_agent' => $context['user_agent'],
                'ip_address' => $context['ip_address'],
                'last_login_at' => now(),
                'last_used_at' => now(),
            ]
        );

        return [
            'session' => $session,
            'is_new_device' => ! $knownDevice,
            'context' => $context,
        ];
    }

    public function validateCurrentTokenBinding(Request $request, User $user, PersonalAccessToken $token): ?UserDeviceSession
    {
        $context = $this->resolveDeviceContext($request);
        $session = $this->findSessionForToken($user, $token);

        if (! $session) {
            $binding = $this->bindTokenToDevice($user, $token, $request);
            return $binding['session'] ?? null;
        }

        if ((string) $session->device_id !== (string) $context['device_id']) {
            if ($this->canMigrateToFrontendDeviceId($request, $context, $session)) {
                return $this->migrateSessionDevice($session, $context);
            }

            return null;
        }

        $session->update([
            'last_used_at' => now(),
            'ip_address' => $context['ip_address'],
            'user_agent' => $context['user_agent'],
            'device_name' => $context['device_name'] ?: $session->device_name,
            'browser' => $context['browser'] ?: $session->browser,
            'os' => $context['os'] ?: $session->os,
        ]);

        return $session;
    }

    public function revokeSession(UserDeviceSession $session): void
    {
        if ($session->personal_access_token_id) {
            PersonalAccessToken::query()->where('id', $session->personal_access_token_id)->delete();
        }

        $session->delete();
    }
}

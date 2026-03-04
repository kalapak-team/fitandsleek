<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\FacebookProvider;
use Laravel\Socialite\Two\GoogleProvider;
use Symfony\Component\HttpFoundation\Cookie as HttpCookie;

class SocialAuthController extends Controller
{
    protected function createOauthTicket(array $payload): string
    {
        $ticket = Str::random(64);
        Cache::put("oauth_ticket:{$ticket}", $payload, now()->addMinutes(10));
        return $ticket;
    }

    protected function callbackPathWithTicket(string $frontendCallbackUrl, string $ticket): string
    {
        return rtrim($frontendCallbackUrl, '/') . '/' . $ticket;
    }

    protected function oauthCookie(Request $request, string $name, string $value)
    {
        return new HttpCookie(
            $name,
            $value,
            now()->addMinutes(10),
            '/',
            null,
            false,
            true,
            false,
            'Lax'
        );
    }

    protected function forgetOauthCookie(Request $request, string $name)
    {
        return new HttpCookie(
            $name,
            '',
            now()->subMinutes(5),
            '/',
            null,
            false,
            true,
            false,
            'Lax'
        );
    }

    protected function resolveProviderRedirectUri(Request $request, string $provider): string
    {
        $configured = trim((string) config("services.{$provider}.redirect", ''));
        if ($configured !== '' && filter_var($configured, FILTER_VALIDATE_URL)) {
            return rtrim($configured, '/');
        }

        $origin = rtrim($request->getSchemeAndHttpHost(), '/');
        return "{$origin}/api/auth/{$provider}/callback";
    }

    protected function providerRedirectUriFromCookieOrRequest(Request $request, string $provider): string
    {
        $candidate = trim((string) $request->cookie('oauth_provider_redirect_uri', ''));

        if ($candidate !== '' && filter_var($candidate, FILTER_VALIDATE_URL)) {
            return rtrim($candidate, '/');
        }

        return $this->resolveProviderRedirectUri($request, $provider);
    }

    protected function socialiteDriver(string $provider, string $redirectUri)
    {
        $serviceConfig = (array) config("services.{$provider}");

        $providerClass = match ($provider) {
            'google' => GoogleProvider::class,
            'facebook' => FacebookProvider::class,
            default => null,
        };

        if ($providerClass === null) {
            return Socialite::driver($provider);
        }

        return Socialite::buildProvider($providerClass, [
            'client_id' => (string) ($serviceConfig['client_id'] ?? ''),
            'client_secret' => (string) ($serviceConfig['client_secret'] ?? ''),
            'redirect' => $redirectUri,
            'guzzle' => (array) ($serviceConfig['guzzle'] ?? []),
        ]);
    }

    protected function resolveFrontendCallbackUrl(Request $request): string
    {
        $candidate = trim((string) $request->query('frontend_callback', ''));

        if ($candidate === '') {
            return $this->frontendUrl() . '/oauth/callback';
        }

        if (!filter_var($candidate, FILTER_VALIDATE_URL)) {
            return $this->frontendUrl() . '/oauth/callback';
        }

        $parts = parse_url($candidate);
        $scheme = strtolower((string) ($parts['scheme'] ?? ''));
        $path = (string) ($parts['path'] ?? '');

        if (!in_array($scheme, ['http', 'https'], true)) {
            return $this->frontendUrl() . '/oauth/callback';
        }

        if ($path !== '/oauth/callback') {
            return $this->frontendUrl() . '/oauth/callback';
        }

        return rtrim($candidate, '/');
    }

    protected function callbackUrlFromCookieOrDefault(Request $request): string
    {
        $candidate = trim((string) $request->cookie('oauth_frontend_callback', ''));

        if ($candidate === '' || !filter_var($candidate, FILTER_VALIDATE_URL)) {
            return $this->frontendUrl() . '/oauth/callback';
        }

        return rtrim($candidate, '/');
    }

    protected function frontendUrl(): string
    {
        return rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
    }

    protected function isValidProvider(string $provider): bool
    {
        return in_array($provider, ['google', 'facebook'], true);
    }

    public function redirect(Request $request, string $provider)
    {
        if (!$this->isValidProvider($provider)) {
            return response()->json(['message' => 'Unsupported provider'], 400);
        }

        $frontendCallbackUrl = $this->resolveFrontendCallbackUrl($request);
        $providerRedirectUri = $this->resolveProviderRedirectUri($request, $provider);

        return $this->socialiteDriver($provider, $providerRedirectUri)
            ->stateless()
            ->redirect()
            ->withCookie($this->oauthCookie($request, 'oauth_frontend_callback', $frontendCallbackUrl))
            ->withCookie($this->oauthCookie($request, 'oauth_provider_redirect_uri', $providerRedirectUri));
    }

    public function callback(Request $request, string $provider)
    {
        if (!$this->isValidProvider($provider)) {
            return response()->json(['message' => 'Unsupported provider'], 400);
        }

        $frontendCallbackUrl = $this->callbackUrlFromCookieOrDefault($request);
        $providerRedirectUri = $this->providerRedirectUriFromCookieOrRequest($request, $provider);
        $forgetCallbackCookie = $this->forgetOauthCookie($request, 'oauth_frontend_callback');
        $forgetProviderRedirectCookie = $this->forgetOauthCookie($request, 'oauth_provider_redirect_uri');

        try {
            $socialUser = $this->socialiteDriver($provider, $providerRedirectUri)
                ->stateless()
                ->user();
        } catch (\Exception $e) {
            // Capture the root cause so we can debug provider errors (redirect_uri, client_id, etc.)
            Log::error('[SocialAuth] Callback failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'query' => request()->query(),
            ]);

            $ticket = $this->createOauthTicket([
                'error' => 'Social login failed. Please try again.',
            ]);

            return redirect($this->callbackPathWithTicket($frontendCallbackUrl, $ticket))
                ->withCookie($forgetCallbackCookie)
                ->withCookie($forgetProviderRedirectCookie);
        }

        $email = $socialUser->getEmail();
        if (!$email) {
            $ticket = $this->createOauthTicket([
                'error' => 'Your social account does not provide an email.',
            ]);

            return redirect($this->callbackPathWithTicket($frontendCallbackUrl, $ticket))
                ->withCookie($forgetCallbackCookie)
                ->withCookie($forgetProviderRedirectCookie);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            $user = User::create([
                'name' => $socialUser->getName() ?: $socialUser->getNickname() ?: 'Customer',
                'email' => $email,
                'password' => Hash::make(Str::random(24)),
                'role' => 'customer',
            ]);
        }

        $token = $user->createToken('fitandsleekpro')->plainTextToken;

        Log::info('[SocialAuth] Callback success', [
            'provider' => $provider,
            'user_id' => $user->id,
            'email' => $user->email,
            'frontend_callback_url' => $frontendCallbackUrl,
        ]);

        $ticket = $this->createOauthTicket([
            'token' => $token,
            'provider' => $provider,
        ]);

        return redirect($this->callbackPathWithTicket($frontendCallbackUrl, $ticket))
            ->withCookie($forgetCallbackCookie)
            ->withCookie($forgetProviderRedirectCookie);
    }

    public function exchange(string $ticket)
    {
        $key = "oauth_ticket:{$ticket}";
        $usedKey = "oauth_ticket_used:{$ticket}";

        $usedPayload = Cache::get($usedKey);
        if (is_array($usedPayload)) {
            return response()->json($usedPayload);
        }

        $payload = Cache::pull($key);

        if (!is_array($payload)) {
            return response()->json([
                'message' => 'OAuth ticket expired or invalid.',
            ], 404);
        }

        Cache::put($usedKey, $payload, now()->addMinutes(5));

        return response()->json($payload);
    }
}

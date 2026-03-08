<?php

namespace App\Support;

class Media
{
    public static function url(?string $path): ?string
    {
        if (!$path)
            return null;

        // already absolute url
        if (preg_match('#^https?://#i', $path))
            return $path;

        // Prefer request host when APP_URL points to localhost/127 to avoid mixed content in prod
        $configured = trim((string) config('app.url')); // may be http://127.0.0.1:8000
        $requestHost = request()->getSchemeAndHttpHost();

        $base = $configured;
        if (preg_match('#^https?://(localhost|127\.0\.0\.1)#i', $configured)) {
            $base = $requestHost ?: $configured;
        }

        if ($base === '' && $requestHost) {
            $base = $requestHost;
        }

        $base = preg_replace('#^http://#i', 'https://', rtrim($base, '/'));

        if ($base) {
            return $base . '/storage/' . ltrim($path, '/');
        }

        return asset('storage/' . ltrim($path, '/'));
    }

    // Backward-compatible alias (so both calls work)
    public static function publicUrl(?string $path): ?string
    {
        return self::url($path);
    }
}

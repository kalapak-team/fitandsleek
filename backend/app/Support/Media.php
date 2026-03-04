<?php

namespace App\Support;

class Media
{
    public static function url(?string $path): ?string
    {
        if (!$path) return null;

        // already absolute url
        if (preg_match('#^https?://#i', $path)) return $path;

        // storage:link -> /storage
        return asset('storage/' . ltrim($path, '/'));
    }

    // Backward-compatible alias (so both calls work)
    public static function publicUrl(?string $path): ?string
    {
        return self::url($path);
    }
}

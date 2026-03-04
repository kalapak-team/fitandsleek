<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureDriver
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->getAttribute('role') === 'driver') {
            return $next($request);
        }

        return response()->json([
            'message' => 'Forbidden (driver only).',
        ], 403);
    }
}

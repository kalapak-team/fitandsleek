<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureSuperAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Check if user is authenticated and has superadmin role
        $isSuperAdmin = false;

        if ($user) {
            // Check role field
            $role = $user->getAttribute('role');
            if ($role === 'superadmin') {
                $isSuperAdmin = true;
            }
        }

        if (! $user || ! $isSuperAdmin) {
            return response()->json([
                'message' => 'Forbidden (superadmin only).',
                'debug' => [
                    'user' => $user ? $user->email : null,
                    'role' => $user ? $user->getAttribute('role') : null,
                ]
            ], 403);
        }

        return $next($request);
    }
}

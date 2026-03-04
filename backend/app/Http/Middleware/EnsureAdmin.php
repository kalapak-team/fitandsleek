<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Check if user is authenticated and has admin or superadmin role
        $isAdmin = false;

        if ($user) {
            // Check role field (admin|superadmin|customer)
            $role = $user->getAttribute('role');
            if ($role === 'admin' || $role === 'superadmin') {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Unauthorized',
            'debug' => [
                'user' => $user ? $user->toArray() : null,
                'role' => $user ? $user->getAttribute('role') : null,
            ]
        ], 403);
    }
}

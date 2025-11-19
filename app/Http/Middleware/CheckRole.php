<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use Illuminate\Support\Facades\Log;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role  The role to check for (e.g., 'admin', 'karyawan').
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        // Hybrid user retrieval
        $user = $request->user(); // Works for Auth::login()
        $sessionUser = $request->session()->get('user');
        
        \Log::info('CheckRole middleware', [
            'required_role' => $role,
            'route' => $request->path(),
            'method' => $request->method(),
            'auth_user' => $user ? get_class($user) : null,
            'session_user' => $sessionUser
        ]);
        
        if (!$user) {
            $user = $sessionUser; // Fallback for manual session
        }

        if (!$user) {
            // If both methods fail, deny access.
            \Log::warning('CheckRole: No user found');
            return response()->json(['status' => false, 'message' => 'Akses ditolak: Tidak terotentikasi.'], 401);
        }
    
        // The user can be an object (from Auth) or an array (from session)
        $userRole = is_array($user) ? ($user['role'] ?? null) : ($user->role ?? null);
        
        \Log::info('CheckRole: User role determined', [
            'is_array' => is_array($user),
            'user_role' => $userRole,
            'user_data' => is_array($user) ? $user : [
                'id' => $user->id ?? null,
                'has_role_attr' => isset($user->role),
                'role_value' => $user->role ?? 'UNDEFINED'
            ]
        ]);
    
        // dukung multi role: "admin|karyawan"
        $allowed = explode('|', $role);
        if (!$userRole || !in_array($userRole, $allowed, true)) {
            \Log::warning('CheckRole: Access denied', [
                'required' => $allowed,
                'got' => $userRole
            ]);
            return response()->json(['status' => false, 'message' => 'Akses ditolak: Peran tidak sesuai.'], 403);
        }
        
        \Log::info('CheckRole: Access granted', ['role' => $userRole]);
    
        return $next($request);
    }
    
}

<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;

class AuditLogMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // 1. Process the request to get the response and status code
        $response = $next($request);

        // 2. We only want to log mutating operations (POST, PUT, PATCH, DELETE)
        $method = $request->method();
        if (!in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return $response;
        }

        // 3. Skip certain noisy or sensitive paths if desired
        $path = $request->path();
        if ($path === 'api/login' || $path === 'api/logout') {
            return $response;
        }

        try {
            $user = $request->user();
            
            // Scrub sensitive fields from payload
            $payload = $request->except(['password', 'password_confirmation', 'currentPassword', 'newPassword']);
            
            // Attempt to get route action name, fallback to generic action
            $action = $request->route() ? $request->route()->getActionName() : 'unknown';
            if ($action === 'Closure' || strpos($action, '@') !== false) {
                // Simplify Controller@method to just the method name or generic description
                $parts = explode('@', class_basename($action));
                $action = end($parts);
            }

            AuditLog::create([
                'user_id' => $user ? $user->id : null,
                'user_name' => $user ? $user->name : null,
                'user_roles' => $user ? implode(',', $user->roles()->pluck('name')->toArray()) : null,
                'method' => $method,
                'path' => $path,
                'action' => $action ?: 'Unknown Action',
                'status' => $response->getStatusCode(),
                'summary' => $payload,
                'ip' => $request->ip()
            ]);
        } catch (\Exception $e) {
            // Failsafe: Do not break the app if audit logging fails
            Log::error('AuditLogMiddleware failed: ' . $e->getMessage());
        }

        return $response;
    }
}

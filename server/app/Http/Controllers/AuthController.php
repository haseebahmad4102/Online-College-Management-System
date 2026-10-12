<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\RateLimiter;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'cnic' => 'required|string|regex:/^[0-9]{5}-[0-9]{7}-[0-9]$/|unique:users,cnic',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
        ]);

        $user = User::create([
            'name' => $request->name,
            'cnic' => $request->cnic,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'must_change_password' => false,
            'is_active' => true,
        ]);

        $applicantRole = \App\Models\Role::where('name', 'applicant')->first();
        if ($applicantRole) {
            \App\Models\UserRole::create([
                'user_id' => $user->id,
                'role_id' => $applicantRole->id,
            ]);
        }

        return response()->json(['message' => 'Account created successfully'], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
            'role' => 'nullable|string|in:admin,principal,clerk,teacher,student,librarian,timetable,applicant,controller_examiner',
        ]);

        $failKey = 'login:'.$request->ip().':'.$request->email;

        if (RateLimiter::tooManyAttempts($failKey, 10)) {
            return response()->json([
                'message' => 'Too many failed sign-in attempts. Please wait 15 minutes and try again.'
            ], 429);
        }

        $user = User::with(['roles.permissions', 'permissions'])->where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            RateLimiter::hit($failKey, 15 * 60);
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        RateLimiter::clear($failKey);

        if (! $user->is_active) {
            return response()->json(['message' => 'This account has been deactivated. Contact the college office.'], 403);
        }

        $userRoles = $user->roles->pluck('name')->toArray();

        if ($request->role && !in_array($request->role, $userRoles)) {
            return response()->json(['message' => "This account is not registered as a {$request->role}. Please use your own role's login tab."], 403);
        }

        // Collect all permissions
        $rolePermissions = $user->roles->flatMap(function($r) {
            return $r->permissions->pluck('name');
        })->toArray();
        
        $activeDirect = $user->permissions->filter(function($p) {
            return !$p->pivot->expires_at || \Carbon\Carbon::parse($p->pivot->expires_at)->isFuture();
        });

        $directPermissions = $activeDirect->pluck('name')->toArray();
        $allPermissions = array_values(array_unique(array_merge($rolePermissions, $directPermissions)));

        $temporaryPermissions = $activeDirect->filter(function($p) {
            return $p->pivot->expires_at != null;
        })->pluck('name')->toArray();

        $expirations = $activeDirect->filter(function($p) {
            return $p->pivot->expires_at != null;
        })->mapWithKeys(function($p) {
            return [$p->name => \Carbon\Carbon::parse($p->pivot->expires_at)->toIso8601String()];
        });

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mustChangePassword' => $user->must_change_password,
                'roles' => $userRoles,
                'permissions' => $allPermissions,
                'temporaryPermissions' => $temporaryPermissions,
                'expirations' => $expirations
            ]
        ]);
    }

    public function me(Request $request)
    {
        $user = $request->user()->load(['roles.permissions', 'permissions']);

        $userRoles = $user->roles->pluck('name')->toArray();

        $rolePermissions = $user->roles->flatMap(function($r) {
            return $r->permissions->pluck('name');
        })->toArray();
        
        $activeDirect = $user->permissions->filter(function($p) {
            return !$p->pivot->expires_at || \Carbon\Carbon::parse($p->pivot->expires_at)->isFuture();
        });

        $directPermissions = $activeDirect->pluck('name')->toArray();
        $allPermissions = array_values(array_unique(array_merge($rolePermissions, $directPermissions)));

        $temporaryPermissions = $activeDirect->filter(function($p) {
            return $p->pivot->expires_at != null;
        })->pluck('name')->toArray();

        $expirations = $activeDirect->filter(function($p) {
            return $p->pivot->expires_at != null;
        })->mapWithKeys(function($p) {
            return [$p->name => \Carbon\Carbon::parse($p->pivot->expires_at)->toIso8601String()];
        });

        return response()->json([
            'user' => [
                'id' => (string) $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'mustChangePassword' => $user->must_change_password,
                'roles' => $userRoles,
                'permissions' => $allPermissions,
                'temporaryPermissions' => $temporaryPermissions,
                'expirations' => $expirations
            ]
        ]);
    }
}

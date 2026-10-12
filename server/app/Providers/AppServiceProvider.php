<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        \Illuminate\Support\Facades\Gate::before(function ($user, $ability) {
            $user->loadMissing('roles.permissions', 'permissions');
            $roles = $user->roles->pluck('name')->toArray();
            
            if (in_array('admin', $roles)) {
                return true;
            }

            $rolePermissions = $user->roles->flatMap(function($r) {
                return $r->permissions->pluck('name');
            })->toArray();
            
            $directPermissions = $user->permissions->pluck('name')->toArray();
            $allPermissions = array_values(array_unique(array_merge($rolePermissions, $directPermissions)));

            if (in_array($ability, $allPermissions)) {
                return true;
            }
        });
    }
}

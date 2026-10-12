<?php
use App\Models\Role;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

$role = Role::firstOrCreate(['name' => 'controller_examiner']);

$user = User::firstOrCreate(
    ['email' => 'ce@ggcm.com'],
    [
        'name' => 'Controller Examiner',
        'password' => Hash::make('password'),
        'status' => 'active'
    ]
);

if (!$user->roles->contains($role->id)) {
    $user->roles()->attach($role->id);
}

echo "Controller Examiner seeded successfully.\n";

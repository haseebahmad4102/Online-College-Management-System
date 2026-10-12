<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $adminRole = \App\Models\Role::firstOrCreate(['name' => 'admin']);
        $principalRole = \App\Models\Role::firstOrCreate(['name' => 'principal']);

        $admin = User::create([
            'name' => 'System Admin',
            'email' => 'admin@ggcm.edu.pk',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'must_change_password' => false,
            'is_active' => true,
        ]);
        $admin->roles()->attach($adminRole);

        $principal = User::create([
            'name' => 'College Principal',
            'email' => 'principal@ggcm.edu.pk',
            'password' => \Illuminate\Support\Facades\Hash::make('password'),
            'must_change_password' => false,
            'is_active' => true,
        ]);
        $principal->roles()->attach($principalRole);
    }
}

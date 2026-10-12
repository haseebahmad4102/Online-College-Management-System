<?php
$role = App\Models\Role::where('name', 'controller_examiner')->first();
if ($role) {
    echo 'Role Perms: ' . $role->permissions()->pluck('name')->implode(',') . "\n";
}

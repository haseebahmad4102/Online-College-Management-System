<?php
use App\Models\Permission;
use App\Models\Role;

$perm = Permission::firstOrCreate(['name' => 'examinations.manage', 'label' => 'Manage Examinations']);
$role = Role::where('name', 'controller_examiner')->first();
if ($role && !$role->permissions->contains($perm->id)) {
    $role->permissions()->attach($perm->id);
}
echo "Permission attached.\n";

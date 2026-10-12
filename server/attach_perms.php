<?php
$perm = App\Models\Permission::firstOrCreate(
    ['name' => 'examinations.manage'],
    ['label' => 'Manage Examinations', 'group' => 'examinations']
);
$role = App\Models\Role::where('name', 'controller_examiner')->first();
if ($role && !$role->permissions()->where('permission_id', $perm->id)->exists()) {
    $role->permissions()->attach($perm->id);
    echo "Attached examinations.manage to controller_examiner.\n";
} else {
    echo "Already attached or role not found.\n";
}

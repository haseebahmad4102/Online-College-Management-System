<?php

namespace App\Services;

use App\Models\Teacher;
use App\Models\Role;
use App\Models\UserRole;

class HodService
{
    public static function checkHodChange($departmentId, $newHodId)
    {
        $teacher = Teacher::with('department')->find($newHodId);

        if (!$teacher) {
            return ['status' => 422, 'message' => 'Teacher not found.'];
        }

        if ($teacher->status !== 'active') {
            return ['status' => 422, 'message' => "{$teacher->name} is not an active teacher."];
        }

        // teacher->department relation represents the `hod_of` since Department belongsTo Teacher (hod)
        // Wait, the schema uses `departments.hod_teacher_id`. So $teacher->hodOf is hasOne(Department::class)
        $hodOf = \App\Models\Department::where('hod_teacher_id', $newHodId)->first();
        if ($hodOf && $hodOf->id != $departmentId) {
            return ['status' => 422, 'message' => "{$teacher->name} is already HOD of {$hodOf->name} — a teacher can head only one department."];
        }

        return null;
    }

    public static function syncHodRole($prevTeacherId, $newTeacherId)
    {
        $hodRole = Role::where('name', 'hod')->first();
        if (!$hodRole) return;

        if ($prevTeacherId && $prevTeacherId != $newTeacherId) {
            $prev = Teacher::find($prevTeacherId);
            if ($prev) {
                UserRole::where('user_id', $prev->user_id)->where('role_id', $hodRole->id)->delete();
            }
        }

        if ($newTeacherId && $newTeacherId != $prevTeacherId) {
            $t = Teacher::find($newTeacherId);
            if ($t) {
                UserRole::updateOrCreate(
                    ['user_id' => $t->user_id, 'role_id' => $hodRole->id],
                    ['user_id' => $t->user_id, 'role_id' => $hodRole->id]
                );
            }
        }
    }
}

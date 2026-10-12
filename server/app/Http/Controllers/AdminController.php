<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\AuditLog;
use App\Models\Role;
use App\Models\Permission;
use App\Models\RoleHasPermission;
use App\Models\Department;
use App\Models\Committee;
use App\Models\CommitteeMember;
use App\Models\CommitteeStudentMember;
use App\Models\User;
use App\Models\UserHasPermission;
use App\Models\UserRole;
use App\Models\Teacher;
use App\Services\HodService;

class AdminController extends Controller
{
    private const SUPER_ROLES = ['admin'];
    private const GRANTABLE_HINT = ['clerk', 'librarian', 'timetable', 'teacher', 'hod', 'student', 'principal', 'controller_examiner'];
    private const ROLE_DEFAULTS = [
        'admin' => ['*'],
        'principal' => ['*'],
        'clerk' => ['academic.manage', 'students.manage', 'admissions.manage', 'merit.manage', 'fees.manage'],
        'librarian' => ['library.manage'],
        'timetable' => ['timetable.manage'],
        'teacher' => ['attendance.mark', 'classwork.manage', 'assessments.manage', 'lectures.manage'],
        'hod' => ['academic.manage', 'teachers.view', 'attendance.view'],
        'controller_examiner' => ['examinations.manage'],
        'student' => [],
        'applicant' => []
    ];

    private function adminOnly(Request $request) {
        $roles = $request->user()->roles->pluck('name')->toArray();
        if (!in_array('admin', $roles)) {
            abort(403, 'Admin access required.');
        }
    }

    // ── Audit Logs ──
    public function getAuditLogs(Request $request)
    {
        Gate::authorize('admin');
        $page = max(1, (int)$request->get('page', 1));
        $perPage = 30;
        
        $q = AuditLog::query();
        if ($request->q) {
            $q->where(function($query) use ($request) {
                $query->where('user_name', 'like', "%{$request->q}%")
                      ->orWhere('path', 'like', "%{$request->q}%")
                      ->orWhere('action', 'like', "%{$request->q}%");
            });
        }
        if ($request->method) {
            $q->where('method', $request->method);
        }

        $total = $q->count();
        $logs = $q->orderBy('id', 'desc')->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'logs' => $logs,
            'total' => $total,
            'page' => $page,
            'pages' => max(1, ceil($total / $perPage))
        ]);
    }

    // ── Permissions Overview ──
    public function getPermissions(Request $request)
    {
        $this->adminOnly($request);
        $roles = Role::withCount('users')->with('permissions')->orderBy('id', 'asc')->get();
        $permissions = Permission::orderBy('group', 'asc')->orderBy('id', 'asc')->get();

        return response()->json([
            'permissions' => $permissions->map(fn($p) => ['id' => $p->id, 'name' => $p->name, 'group' => $p->group, 'label' => $p->label]),
            'roles' => $roles->map(fn($r) => [
                'id' => $r->id,
                'name' => $r->name,
                'users' => $r->users_count,
                'superAdmin' => in_array($r->name, self::SUPER_ROLES),
                'grantable' => in_array($r->name, self::GRANTABLE_HINT),
                'permissions' => $r->permissions->pluck('id')
            ]),
            'defaults' => self::ROLE_DEFAULTS
        ]);
    }

    public function grantRolePermission(Request $request, $roleName)
    {
        $this->adminOnly($request);
        $role = Role::where('name', $roleName)->firstOrFail();
        if (in_array($role->name, self::SUPER_ROLES)) {
            return response()->json(['message' => "The {$role->name} role always has full access."], 422);
        }
        $permission = Permission::where('name', $request->permission ?? '')->first();
        if (!$permission) return response()->json(['message' => 'Unknown permission.'], 422);

        RoleHasPermission::updateOrCreate(
            ['role_id' => $role->id, 'permission_id' => $permission->id]
        );
        return response()->json(['message' => "\"{$role->name}\" can now {$permission->label}."]);
    }

    public function revokeRolePermission(Request $request, $roleName, $permissionName)
    {
        $this->adminOnly($request);
        $role = Role::where('name', $roleName)->firstOrFail();
        if (in_array($role->name, self::SUPER_ROLES)) {
            return response()->json(['message' => "The {$role->name} role always has full access."], 422);
        }
        $permission = Permission::where('name', $permissionName)->first();
        if (!$permission) return response()->json(['message' => 'Unknown permission.'], 422);

        RoleHasPermission::where('role_id', $role->id)->where('permission_id', $permission->id)->delete();
        return response()->json(['message' => "\"{$role->name}\" can no longer {$permission->label}."]);
    }

    // ── Departments & HOD ──
    public function getDepartments(Request $request)
    {
        Gate::authorize('admin');
        $deps = Department::with(['hod.designation', 'teachers.designation', 'teachers.committees.committee'])->withCount('programs')->orderBy('name', 'asc')->get();
        return response()->json(['departments' => $deps]);
    }

    public function updateDepartmentHod(Request $request, $id)
    {
        Gate::authorize('admin');
        $dept = Department::with('hod')->findOrFail($id);
        $newHodId = $request->teacherId;

        if ($dept->hod_teacher_id == $newHodId) {
            return response()->json(['message' => "That teacher is already this department's HOD."], 422);
        }
        if ($newHodId) {
            $err = HodService::checkHodChange($id, $newHodId);
            if ($err) return response()->json(['message' => $err['message']], $err['status']);
            $t = Teacher::find($newHodId);
            if ($t->department_id != $id) {
                return response()->json(['message' => "{$t->name} belongs to another department — a HOD must be from the department they head."], 422);
            }
        }
        $prev = $dept->hod_teacher_id;
        $dept->update(['hod_teacher_id' => $newHodId]);
        HodService::syncHodRole($prev, $newHodId);

        $msg = $newHodId ? Teacher::find($newHodId)->name . " is now HOD of {$dept->name}." : "The HOD is no longer HOD of {$dept->name}.";
        return response()->json(['message' => $msg]);
    }

    // ── Committees ──
    public function getCommittees(Request $request)
    {
        Gate::authorize('admin');
        return response()->json([
            'committees' => Committee::with(['members.teacher.department', 'members.teacher.designation', 'studentMembers.student.program', 'studentMembers.student.classSection'])->orderBy('name', 'asc')->get()
        ]);
    }

    public function storeCommittee(Request $request)
    {
        Gate::authorize('admin');
        $request->validate(['name' => 'required|min:3']);
        $c = Committee::create(['name' => trim($request->name), 'description' => $request->description]);
        $c->load(['members.teacher.department', 'members.teacher.designation', 'studentMembers.student.program', 'studentMembers.student.classSection']);
        return response()->json(['committee' => $c], 201);
    }

    public function updateCommittee(Request $request, $id)
    {
        Gate::authorize('admin');
        $c = Committee::findOrFail($id);
        $c->update(['name' => trim($request->name ?? $c->name), 'description' => $request->description ?? $c->description]);
        $c->load(['members.teacher.department', 'members.teacher.designation', 'studentMembers.student.program', 'studentMembers.student.classSection']);
        return response()->json(['committee' => $c]);
    }

    public function deleteCommittee($id)
    {
        Gate::authorize('admin');
        $c = Committee::findOrFail($id);
        $name = $c->name;
        $c->delete();
        return response()->json(['message' => "\"{$name}\" committee deleted."]);
    }

    public function addCommitteeMember(Request $request, $id)
    {
        Gate::authorize('admin');
        $pos = $request->position ?? 'member';
        if (!in_array($pos, ['convener', 'secretary', 'member'])) return response()->json(['message' => 'Invalid position'], 422);
        
        $c = Committee::findOrFail($id);
        $t = Teacher::findOrFail($request->teacherId);

        if ($t->status !== 'active') return response()->json(['message' => "{$t->name} is not an active teacher."], 422);

        if ($pos === 'convener') {
            CommitteeMember::where('committee_id', $id)->where('position', 'convener')->where('teacher_id', '!=', $t->id)->update(['position' => 'member']);
        }
        CommitteeMember::updateOrCreate(
            ['committee_id' => $id, 'teacher_id' => $t->id],
            ['position' => $pos]
        );
        return response()->json(['message' => "{$t->name} added to \"{$c->name}\" as {$pos}."]);
    }

    public function removeCommitteeMember($id, $teacherId)
    {
        Gate::authorize('admin');
        CommitteeMember::where('committee_id', $id)->where('teacher_id', $teacherId)->delete();
        return response()->json(['message' => 'Member removed from the committee.']);
    }

    public function addCommitteeStudentMember(Request $request, $id)
    {
        Gate::authorize('admin');
        $pos = $request->position ?? 'member';
        $c = Committee::findOrFail($id);
        $s = \App\Models\Student::findOrFail($request->studentId);

        if ($s->status !== 'active') return response()->json(['message' => "{$s->name} is not an active student."], 422);

        CommitteeStudentMember::updateOrCreate(
            ['committee_id' => $id, 'student_id' => $s->id],
            ['position' => $pos]
        );
        return response()->json(['message' => "{$s->name} added to \"{$c->name}\" as {$pos}."]);
    }

    public function removeCommitteeStudentMember($id, $studentId)
    {
        Gate::authorize('admin');
        CommitteeStudentMember::where('committee_id', $id)->where('student_id', $studentId)->delete();
        return response()->json(['message' => 'Student removed from the committee.']);
    }

    // ── Direct Permissions ──
    public function getUserPermissions(Request $request, $id)
    {
        $this->adminOnly($request);
        $user = User::with('permissions')->findOrFail($id);
        return response()->json(['permissions' => $user->permissions->pluck('id')]);
    }

    public function grantUserPermission(Request $request, $id)
    {
        $this->adminOnly($request);
        if ($id == $request->user()->id) return response()->json(['message' => 'Cannot change own permissions.'], 422);
        
        $user = User::findOrFail($id);
        $p = Permission::where('name', $request->permission)->firstOrFail();
        $expires = $request->expiresAt ? \Carbon\Carbon::parse($request->expiresAt) : null;

        UserHasPermission::updateOrCreate(
            ['user_id' => $user->id, 'permission_id' => $p->id],
            ['expires_at' => $expires]
        );
        
        \App\Models\Notification::create([
            'user_id' => $user->id,
            'type' => 'permission',
            'title' => 'Permission Granted',
            'body' => "You have been granted '{$p->label}'" . ($expires ? " until " . $expires->format('d M Y h:i A') . "." : "."),
        ]);
        
        return response()->json(['message' => "{$user->name} can now {$p->label}."]);
    }

    public function revokeUserPermission(Request $request, $id, $permissionName)
    {
        $this->adminOnly($request);
        if ($id == $request->user()->id) return response()->json(['message' => 'Cannot change own permissions.'], 422);
        
        $user = User::findOrFail($id);
        $p = Permission::where('name', $permissionName)->firstOrFail();

        UserHasPermission::where('user_id', $user->id)->where('permission_id', $p->id)->delete();
        return response()->json(['message' => "{$user->name} can no longer {$p->label}."]);
    }

    public function bulkUserPermission(Request $request)
    {
        $this->adminOnly($request);
        $request->validate([
            'userIds' => 'required|array',
            'userIds.*' => 'integer',
            'permission' => 'required|string',
            'action' => 'required|in:grant,revoke',
            'expiresAt' => 'nullable|date'
        ]);

        $p = Permission::where('name', $request->permission)->firstOrFail();
        
        if ($request->action === 'grant') {
            $expires = $request->expiresAt ? \Carbon\Carbon::parse($request->expiresAt) : null;
            foreach ($request->userIds as $uid) {
                // Prevent self-modification
                if ($uid != $request->user()->id) {
                    UserHasPermission::updateOrCreate(
                        ['user_id' => $uid, 'permission_id' => $p->id],
                        ['expires_at' => $expires]
                    );
                    \App\Models\Notification::create([
                        'user_id' => $uid,
                        'type' => 'permission',
                        'title' => 'Permission Granted',
                        'body' => "You have been granted '{$p->label}'" . ($expires ? " until " . $expires->format('d M Y h:i A') . "." : "."),
                    ]);
                }
            }
            return response()->json(['message' => "Granted '{$p->label}' to selected users."]);
        } else {
            UserHasPermission::whereIn('user_id', $request->userIds)
                ->where('permission_id', $p->id)
                ->where('user_id', '!=', $request->user()->id)
                ->delete();
            return response()->json(['message' => "Revoked '{$p->label}' from selected users."]);
        }
    }

    // ── User Roles ──
    public function grantUserRole(Request $request, $id)
    {
        $this->adminOnly($request);
        if ($id == $request->user()->id) return response()->json(['message' => 'Cannot change own roles.'], 422);
        
        $user = User::findOrFail($id);
        $role = Role::where('name', $request->role)->firstOrFail();

        UserRole::updateOrCreate(['user_id' => $user->id, 'role_id' => $role->id]);
        return response()->json(['message' => "{$user->name} now has the \"{$role->name}\" role."]);
    }

    public function revokeUserRole(Request $request, $id, $roleName)
    {
        $this->adminOnly($request);
        if ($id == $request->user()->id) return response()->json(['message' => 'Cannot change own roles.'], 422);
        
        $role = Role::where('name', $roleName)->firstOrFail();
        $user = User::with('roles')->findOrFail($id);

        if (!$user->roles->contains('id', $role->id)) {
            return response()->json(['message' => "User does not have role."], 422);
        }
        if ($role->name === 'admin' && UserRole::where('role_id', $role->id)->count() <= 1) {
            return response()->json(['message' => 'Cannot remove the last admin.'], 422);
        }
        if ($user->roles->count() === 1) {
            return response()->json(['message' => "An account needs at least one role."], 422);
        }

        UserRole::where('user_id', $user->id)->where('role_id', $role->id)->delete();

        if ($role->name === 'hod') {
            $t = Teacher::where('user_id', $user->id)->first();
            if ($t) Department::where('hod_teacher_id', $t->id)->update(['hod_teacher_id' => null]);
        }
        return response()->json(['message' => "Role removed."]);
    }

    public function toggleUserActive(Request $request, $id)
    {
        $this->adminOnly($request);
        $user = User::findOrFail($id);
        if ($user->id == $request->user()->id) return response()->json(['message' => 'Cannot deactivate own account.'], 422);

        $user->update(['is_active' => !!$request->isActive]);
        $state = $user->is_active ? 'active' : 'disabled';
        return response()->json(['message' => "{$user->name}'s account is now {$state}."]);
    }
}

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Role;
use App\Models\UserRole;
use App\Models\Notification;

class UserController extends Controller
{
    private const STAFF_ROLES = ['clerk', 'librarian', 'timetable'];
    private const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';

    private function genTempPassword($length = 10)
    {
        $out = '';
        $max = strlen(self::ALPHABET) - 1;
        for ($i = 0; $i < $length; $i++) {
            $out .= self::ALPHABET[random_int(0, $max)];
        }
        return $out;
    }

    public function index(Request $request)
    {
        Gate::authorize('staff.manage');
        
        $q = User::with(['roles', 'student.program', 'teacher.department'])->orderBy('name', 'asc');
        if (!$request->role && !$request->q) {
            $q->take(50); // limit to 50 only on default empty load to save resources
        }
        
        if ($request->q) {
            $q->where(function($query) use ($request) {
                $query->where('name', 'like', "%{$request->q}%")
                      ->orWhere('email', 'like', "%{$request->q}%")
                      ->orWhereHas('student', function($sq) use ($request) {
                          $sq->where('roll_number', 'like', "%{$request->q}%");
                      })
                      ->orWhereHas('teacher.department', function($dq) use ($request) {
                          $dq->where('name', 'like', "%{$request->q}%");
                      });
            });
        }
        
        if ($request->role) {
            $q->whereHas('roles', function($query) use ($request) {
                $query->where('name', $request->role);
            });
        }
        
        $users = $q->get()->map(function($u) {
            $extra = '';
            if ($u->student) {
                $extra = "Student - Roll No: " . ($u->student->roll_number ?? 'N/A') . " - " . ($u->student->program->name ?? '');
            } elseif ($u->teacher) {
                $extra = "Teacher - Dept: " . ($u->teacher->department->name ?? 'N/A');
            }

            return [
                'id' => (string)$u->id,
                'name' => $u->name,
                'email' => $u->email,
                'extra' => $extra,
                'isActive' => $u->is_active,
                'roles' => $u->roles->pluck('name')
            ];
        });

        return response()->json(['users' => $users]);
    }

    public function store(Request $request)
    {
        Gate::authorize('staff.manage');
        
        $request->validate([
            'name' => 'required|min:3',
            'email' => 'required|email',
            'role' => 'required|in:' . implode(',', self::STAFF_ROLES)
        ]);

        if (User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'An account with this email already exists.'], 422);
        }

        $roleRow = Role::where('name', $request->role)->firstOrFail();
        $tempPassword = $this->genTempPassword();

        $user = User::create([
            'name' => trim($request->name),
            'email' => $request->email,
            'password' => Hash::make($tempPassword),
            'must_change_password' => true
        ]);

        UserRole::create(['user_id' => $user->id, 'role_id' => $roleRow->id]);

        return response()->json([
            'user' => [
                'id' => (string)$user->id,
                'name' => $user->name,
                'email' => $user->email,
                'isActive' => $user->is_active,
                'roles' => [$request->role]
            ],
            'tempPassword' => $tempPassword
        ], 201);
    }

    public function resetPassword(Request $request, $id)
    {
        Gate::authorize('staff.manage');

        $generated = empty($request->newPassword);
        $newPassword = $request->newPassword ?: $this->genTempPassword();

        if (strlen($newPassword) < 8) {
            return response()->json(['message' => 'New password must be at least 8 characters.'], 422);
        }

        $user = User::findOrFail($id);
        $user->update([
            'password' => Hash::make($newPassword),
            'must_change_password' => true
        ]);

        $res = ['message' => "Password for {$user->name} has been reset."];
        if ($generated) $res['tempPassword'] = $newPassword;

        return response()->json($res);
    }

    public function toggleActive(Request $request, $id)
    {
        Gate::authorize('staff.manage');

        $user = User::with('roles')->findOrFail($id);
        
        if ($user->id == $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $roles = $user->roles->pluck('name')->toArray();
        if (empty(array_intersect(self::STAFF_ROLES, $roles))) {
            return response()->json(['message' => 'Only staff accounts can be managed here.'], 422);
        }

        $user->update(['is_active' => !!$request->isActive]);
        $state = $user->is_active ? 'active' : 'disabled';
        return response()->json(['message' => "{$user->name}'s account is now {$state}."]);
    }

    public function destroy(Request $request, $id)
    {
        Gate::authorize('staff.manage');

        $user = User::with('roles')->findOrFail($id);
        
        if ($user->id == $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $roles = $user->roles->pluck('name')->toArray();
        foreach ($roles as $r) {
            if (!in_array($r, self::STAFF_ROLES)) {
                return response()->json(['message' => 'Only staff accounts (clerk, librarian, timetable) can be deleted here.'], 422);
            }
        }

        DB::transaction(function () use ($user) {
            Notification::where('user_id', $user->id)->delete();
            $user->delete();
        });

        return response()->json(['message' => "{$user->name}'s account has been deleted."]);
    }
}

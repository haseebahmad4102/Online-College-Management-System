<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Hash;

class StaffController extends Controller
{
    public function index(Request $request)
    {
        Gate::authorize('staff.manage');

        $staff = Staff::with('user')->get();

        return response()->json(['staff' => $staff]);
    }

    public function store(Request $request)
    {
        Gate::authorize('staff.manage');

        $req = $request->validate([
            'name' => 'required|string|max:255',
            'cnic' => 'required|string|unique:staff,cnic',
            'phone' => 'nullable|string',
            'designation' => 'required|string|max:255',
            'status' => 'required|string|in:active,inactive',
            'create_user' => 'boolean',
            'email' => 'required_if:create_user,true|email|unique:users,email',
            'role' => 'required_if:create_user,true|string|exists:roles,name'
        ]);

        $userId = null;
        if (!empty($req['create_user'])) {
            $user = User::create([
                'name' => $req['name'],
                'email' => $req['email'],
                'password' => Hash::make('password')
            ]);
            // Assuming Spatie roles or similar, in this project we use DB roles.
            // Based on previous files, roles are attached.
            // For now we just create the user. The frontend can handle roles separately if needed.
            // Wait, we can attach the role if we have UserRole.
            \App\Models\UserRole::create([
                'user_id' => $user->id,
                'role_id' => \App\Models\Role::where('name', $req['role'])->first()->id
            ]);
            $userId = $user->id;
        }

        $staff = Staff::create([
            'user_id' => $userId,
            'name' => $req['name'],
            'cnic' => $req['cnic'],
            'phone' => $req['phone'],
            'designation' => $req['designation'],
            'status' => $req['status']
        ]);

        return response()->json([
            'message' => 'Staff added successfully',
            'staff' => Staff::with('user')->find($staff->id)
        ]);
    }

    public function update(Request $request, $id)
    {
        Gate::authorize('staff.manage');

        $staff = Staff::findOrFail($id);

        $req = $request->validate([
            'name' => 'required|string|max:255',
            'cnic' => 'required|string|unique:staff,cnic,' . $staff->id,
            'phone' => 'nullable|string',
            'designation' => 'required|string|max:255',
            'status' => 'required|string|in:active,inactive'
        ]);

        $staff->update($req);

        if ($staff->user) {
            $staff->user->update(['name' => $req['name']]);
        }

        return response()->json([
            'message' => 'Staff updated successfully',
            'staff' => Staff::with('user')->find($staff->id)
        ]);
    }

    public function destroy(Request $request, $id)
    {
        Gate::authorize('staff.manage');

        $staff = Staff::findOrFail($id);
        
        // Optionally delete user if needed, but usually better to just deactivate
        if ($staff->user) {
            $staff->user->update(['is_active' => false]);
        }
        
        $staff->delete();

        return response()->json(['message' => 'Staff deleted successfully']);
    }
}

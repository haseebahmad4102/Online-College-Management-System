<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\File;
use App\Models\Teacher;
use App\Models\User;
use App\Models\Role;

class TeacherController extends Controller
{
    private function handleUpload($file, $folder)
    {
        $filename = time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
        $path = public_path("uploads/{$folder}");
        if (!File::exists($path)) {
            File::makeDirectory($path, 0755, true);
        }
        $file->move($path, $filename);
        return "/uploads/{$folder}/{$filename}";
    }

    public function getMe(Request $request)
    {
        if (!$request->user()->hasRole('teacher')) abort(403);
        
        $teacher = Teacher::with(['department', 'designation'])
            ->where('user_id', $request->user()->id)
            ->firstOrFail();
            
        return response()->json(['teacher' => $teacher]);
    }

    public function updateMe(Request $request)
    {
        if (!$request->user()->hasRole('teacher')) abort(403);
        
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        
        $data = [];
        if ($request->has('qualification')) $data['qualification'] = $request->qualification ?: null;
        if ($request->has('specialization')) $data['specialization'] = $request->specialization ?: null;
        if ($request->has('education')) $data['education'] = $request->education ?: null;
        if ($request->has('experience')) $data['experience'] = $request->experience ?: null;
        if ($request->has('phone') && $request->phone) $data['phone'] = $request->phone;

        $teacher->update($data);
        return response()->json([
            'teacher' => $teacher,
            'message' => 'Profile updated — it is live on the Faculty page.'
        ]);
    }

    public function updateMePhoto(Request $request)
    {
        if (!$request->user()->hasRole('teacher')) abort(403);
        
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        
        if (!$request->hasFile('photo')) return response()->json(['message' => 'A photo file is required.'], 422);
        
        $file = $request->file('photo');

        // Check for blue background using GD
        $path = $file->getPathname();
        $type = @exif_imagetype($path);
        
        if (in_array($type, [IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP])) {
            $img = null;
            if ($type == IMAGETYPE_JPEG) $img = @imagecreatefromjpeg($path);
            elseif ($type == IMAGETYPE_PNG) $img = @imagecreatefrompng($path);
            elseif ($type == IMAGETYPE_WEBP) $img = @imagecreatefromwebp($path);
            
            if ($img) {
                $w = imagesx($img);
                $h = imagesy($img);
                // Sample 4 corners, slightly inset
                $pts = [
                    ['x' => max(1, intval($w * 0.05)), 'y' => max(1, intval($h * 0.05))],
                    ['x' => min($w - 1, intval($w * 0.95)), 'y' => max(1, intval($h * 0.05))],
                    ['x' => max(1, intval($w * 0.05)), 'y' => min($h - 1, intval($h * 0.95))],
                    ['x' => min($w - 1, intval($w * 0.95)), 'y' => min($h - 1, intval($h * 0.95))],
                ];
                
                $blueCount = 0;
                foreach ($pts as $p) {
                    $rgb = @imagecolorat($img, $p['x'], $p['y']);
                    if ($rgb !== false) {
                        $colors = @imagecolorsforindex($img, $rgb);
                        // True blue: Blue channel is higher than red and green, and relatively bright
                        if ($colors && $colors['blue'] > $colors['red'] + 15 && $colors['blue'] > $colors['green'] + 10 && $colors['blue'] > 50) {
                            $blueCount++;
                        }
                    }
                }
                imagedestroy($img);
                
                // If the background doesn't appear blue in at least 2 corners, reject it.
                if ($blueCount < 2) {
                    return response()->json(['message' => 'Profile picture rejected. Please upload a passport-size photo with a solid BLUE background.'], 422);
                }
            }
        }
        
        $url = $this->handleUpload($file, 'teachers');
        $teacher->update(['photo_path' => $url]);
        
        return response()->json(['message' => 'Photo updated.', 'url' => $url]);
    }

    public function index(Request $request)
    {
        Gate::authorize('teachers.view');
        
        $q = Teacher::with(['department', 'designation']);
        
        if ($request->query('department')) $q->where('department_id', (int)$request->query('department'));
        if ($request->query('type')) $q->where('teacher_type', $request->query('type'));
        if ($request->query('q')) $q->where('name', 'like', "%{$request->query('q')}%");

        $q->orderBy('name', 'asc');

        if ($request->query('all') === '1') {
            $teachers = $q->get();
            return response()->json(['teachers' => $teachers, 'total' => $teachers->count(), 'page' => 1, 'pages' => 1]);
        }

        $page = max(1, (int)$request->query('page', 1));
        $perPage = min(100, max(5, (int)$request->query('perPage', 25)));

        $total = $q;
        $totalCount = $total->count();
        
        $teachers = $q->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'teachers' => $teachers,
            'total' => $totalCount,
            'page' => $page,
            'pages' => max(1, ceil($totalCount / $perPage))
        ]);
    }

    public function show($id)
    {
        Gate::authorize('teachers.view');
        
        $teacher = Teacher::with([
            'department', 'designation',
            'allocations.subject', 'allocations.classSection.program'
        ])->find($id);

        if (!$teacher) return response()->json(['message' => 'Teacher not found.'], 404);
        return response()->json(['teacher' => $teacher]);
    }

    public function store(Request $request)
    {
        Gate::authorize('teachers.create');
        
        $req = $request->validate([
            'name' => 'required|string',
            'cnic' => 'required|string|regex:/^[0-9]{5}-[0-9]{7}-[0-9]$/',
            'gender' => 'required|string',
            'phone' => 'required|string',
            'email' => 'required|email',
            'departmentId' => 'required|integer',
            'designationId' => 'required|integer',
            'teacherType' => 'required|string'
        ], [
            'cnic.regex' => 'CNIC must be in #####-#######-# format.'
        ]);

        $clash = User::where('email', $req['email'])->orWhere('cnic', $req['cnic'])->first();
        if ($clash) {
            $msg = $clash->cnic === $req['cnic'] ? 'An account with this CNIC already exists.' : 'An account with this email already exists.';
            return response()->json(['message' => $msg], 422);
        }

        $tempPassword = Str::random(10);
        $teacher = DB::transaction(function() use ($request, $req, $tempPassword) {
            $user = User::create([
                'name' => $req['name'],
                'email' => $req['email'],
                'cnic' => $req['cnic'],
                'phone' => $req['phone'],
                'password' => Hash::make($tempPassword),
                'must_change_password' => true
            ]);

            $role = Role::where('name', 'teacher')->first();
            $user->roles()->attach($role->id);

            return Teacher::create([
                'user_id' => $user->id,
                'name' => $req['name'],
                'father_name' => $request->fatherName ?: null,
                'cnic' => $req['cnic'],
                'gender' => $req['gender'],
                'phone' => $req['phone'],
                'email' => $req['email'],
                'department_id' => $req['departmentId'],
                'designation_id' => $req['designationId'],
                'teacher_type' => $req['teacherType'],
                'qualification' => $request->qualification ?: null,
                'specialization' => $request->specialization ?: null,
                'joining_date' => $request->joiningDate ?: null
            ]);
        });

        return response()->json(['teacher' => $teacher, 'tempPassword' => $tempPassword], 201);
    }

    public function update(Request $request, $id)
    {
        Gate::authorize('teachers.update');
        
        $teacher = Teacher::findOrFail($id);
        
        $data = [];
        if ($request->has('name')) $data['name'] = $request->name;
        if ($request->has('fatherName')) $data['father_name'] = $request->fatherName;
        if ($request->has('phone')) $data['phone'] = $request->phone;
        if ($request->has('email')) $data['email'] = $request->email;
        if ($request->has('departmentId')) $data['department_id'] = (int)$request->departmentId;
        if ($request->has('designationId')) $data['designation_id'] = (int)$request->designationId;
        if ($request->has('teacherType')) $data['teacher_type'] = $request->teacherType;
        if ($request->has('qualification')) $data['qualification'] = $request->qualification;
        if ($request->has('specialization')) $data['specialization'] = $request->specialization;
        if ($request->has('education')) $data['education'] = $request->education;
        if ($request->has('experience')) $data['experience'] = $request->experience;
        if ($request->has('status')) $data['status'] = $request->status;

        $teacher->update($data);
        return response()->json(['teacher' => $teacher]);
    }

    public function destroy(Request $request, $id)
    {
        Gate::authorize('teachers.delete');
        
        $teacher = Teacher::find($id);
        if (!$teacher) return response()->json(['message' => 'Teacher not found.'], 404);

        try {
            DB::transaction(function() use ($teacher) {
                $teacher->delete();
                \App\Models\Notification::where('user_id', $teacher->user_id)->delete();
                User::where('id', $teacher->user_id)->delete();
            });
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'This teacher has class allocations or timetable periods. Remove those first, or set their status to "Left".'], 422);
            }
            throw $e;
        }

        return response()->json(['message' => 'Teacher and their login account deleted.']);
    }
}

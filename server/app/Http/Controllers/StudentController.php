<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Challan;
use App\Models\ClassSection;
use App\Models\User;
use App\Services\SettingService;
use App\Services\NotifyService;

class StudentController extends Controller
{
    private const SETTABLE_STATUS = [
        'active' => 'is back on the rolls',
        'inactive' => 'has been marked inactive',
        'struck_off' => 'has been struck off (expelled)',
    ];

    public function getMe(Request $request)
    {
        $student = Student::with([
            'program',
            'classSection.academicSession',
            'challans' => fn($q) => $q->with('items')->orderBy('id', 'desc')
        ])->where('user_id', $request->user()->id)->firstOrFail();

        if ($student->application_id) {
            $admissionChallans = Challan::with('items')
                ->where('application_id', $student->application_id)
                ->orderBy('id', 'desc')->get();
            
            $seen = collect($student->challans)->pluck('id')->toArray();
            $merged = collect($student->challans);
            foreach ($admissionChallans as $ac) {
                if (!in_array($ac->id, $seen)) {
                    $merged->push($ac);
                }
            }
            // Temporarily replace collection for response
            $student->setRelation('challans', $merged);
        }

        return response()->json(['student' => $student]);
    }

    public function uploadPhoto(Request $request)
    {
        if (!$request->hasFile('photo')) return response()->json(['message' => 'A photo file is required.'], 422);

        $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        $file = $request->file('photo');
        $path = $file->store('students', 'public');
        
        $url = '/storage/' . $path;
        $student->update(['photo_path' => $url]);

        return response()->json(['message' => 'Photo updated.', 'photoPath' => $url]);
    }

    public function getCard(Request $request)
    {
        $student = Student::with(['program', 'classSection.academicSession'])->where('user_id', $request->user()->id)->firstOrFail();
        
        $college = [
            'nameEn' => SettingService::getSetting('site.college_name_en', ''),
            'nameUr' => SettingService::getSetting('site.college_name_ur', ''),
        ];

        $validUntil = null;
        if ($student->classSection && $student->classSection->academicSession) {
            $validUntil = $student->classSection->academicSession->end_year . '-08-31';
        }

        return response()->json([
            'student' => $student,
            'college' => $college,
            'validUntil' => $validUntil
        ]);
    }

    public function index(Request $request)
    {
        Gate::authorize('students.view');

        $q = Student::with(['program.department', 'classSection', 'user' => fn($u) => $u->select('id', 'email')])
            ->orderBy('roll_number', 'asc');

        if ($request->filled('q')) {
            $q->where(function($w) use ($request) {
                $w->where('name', 'like', '%' . $request->q . '%')
                  ->orWhere('roll_number', 'like', '%' . $request->q . '%');
            });
        }
        if ($request->filled('programLevelId')) {
            $q->whereHas('program', fn($w) => $w->where('program_level_id', $request->programLevelId));
        }
        if ($request->filled('program')) $q->where('program_id', $request->program);
        if ($request->filled('groupId')) {
            $q->where(function ($w) use ($request) {
                $w->where('inter_group_id', $request->groupId)
                  ->orWhere('matric_group_id', $request->groupId);
            });
        }
        if ($request->filled('shift')) {
            if ($request->shift === 'unassigned') {
                $q->whereNull('class_section_id');
            } else {
                $q->whereHas('classSection', fn($w) => $w->where('shift', $request->shift));
            }
        }
        if ($request->filled('termNo')) {
            $q->whereHas('classSection', fn($w) => $w->where('term_no', $request->termNo));
        }
        if ($request->filled('department')) {
            $q->whereHas('program', fn($w) => $w->where('department_id', $request->department));
        }
        if ($request->filled('session')) $q->where('academic_session_id', $request->session);

        if ($request->get('all') === '1') {
            $students = $q->get();
            return response()->json(['students' => $students, 'total' => $students->count(), 'page' => 1, 'pages' => 1]);
        }

        $page = max(1, (int)$request->get('page', 1));
        $perPage = min(100, max(5, (int)$request->get('perPage', 25)));

        $total = $q->count();
        $students = $q->skip(($page - 1) * $perPage)->take($perPage)->get();

        return response()->json([
            'students' => $students,
            'total' => $total,
            'page' => $page,
            'pages' => max(1, ceil($total / $perPage))
        ]);
    }

    public function updateSection(Request $request, $id)
    {
        Gate::authorize('students.update');

        $section = ClassSection::withCount('students')->find($request->classSectionId);
        if (!$section) return response()->json(['message' => 'Class shift not found.'], 404);
        
        $student = Student::findOrFail($id);

        if ($section->capacity && $section->students_count >= $section->capacity && $student->class_section_id !== $section->id) {
            return response()->json(['message' => "{$section->shift} class shift is full ({$section->capacity})."], 422);
        }

        $student->update(['class_section_id' => $section->id]);

        return response()->json(['student' => $student]);
    }

    public function updateStatus(Request $request, $id)
    {
        Gate::authorize('students.update');
        $status = $request->status;

        if (!array_key_exists($status, self::SETTABLE_STATUS)) {
            return response()->json(['message' => 'Status must be one of: ' . implode(', ', array_keys(self::SETTABLE_STATUS)) . '.'], 422);
        }

        $existing = Student::findOrFail($id);
        if ($existing->status === $status) {
            return response()->json(['student' => $existing, 'message' => 'No change — the student already has that status.']);
        }

        $student = DB::transaction(function() use ($existing, $status) {
            $existing->update(['status' => $status]);
            
            if ($status === 'struck_off') {
                User::where('id', $existing->user_id)->update(['is_active' => false]);
            }
            if ($status === 'active') {
                User::where('id', $existing->user_id)->update(['is_active' => true]);
            }
            return $existing;
        });

        $note = $request->reason ? " Reason: " . substr((string)$request->reason, 0, 300) : "";
        $title = $status === 'active' ? 'Your student status is active again' : 'Your student status has changed';
        $body = $status === 'struck_off'
            ? "You have been struck off the rolls and your portal access has been withdrawn. Contact the college office.{$note}"
            : ($status === 'inactive'
                ? "Your record has been marked inactive — you are temporarily off the rolls. Contact the college office to resume.{$note}"
                : "Your record is active again. Welcome back!{$note}");
        
        try {
            NotifyService::notify($student->user_id, 'academic', $title, $body, '/portal');
        } catch (\Exception $e) {}

        return response()->json(['student' => $student, 'message' => "{$student->name} " . self::SETTABLE_STATUS[$status] . "."]);
    }
}

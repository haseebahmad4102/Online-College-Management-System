<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Assessment;
use App\Models\AssessmentMark;
use App\Models\Allocation;
use App\Models\Teacher;
use App\Models\Student;
use App\Services\NotifyService;

class AssessmentController extends Controller
{
    public function index(Request $request)
    {
        $q = Assessment::with([
            'allocation.subject',
            'allocation.classSection.program.department'
        ])
        ->withCount('marks')
        ->orderBy('id', 'desc');

        $isManager = $request->user()->hasPermission('marks.manage');
        if (!$isManager) {
            $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
            $q->whereHas('allocation', fn($q) => $q->where('teacher_id', $teacher->id));
        }

        if ($request->filled('allocation')) {
            $q->where('allocation_id', $request->allocation);
        }

        return response()->json(['assessments' => $q->get()]);
    }

    public function store(Request $request)
    {
        $req = $request->validate([
            'allocationId' => 'required|integer',
            'type' => 'required|string',
            'title' => 'required|string',
            'totalMarks' => 'required|numeric'
        ]);

        $alloc = Allocation::findOrFail($req['allocationId']);
        $isManager = $request->user()->hasPermission('marks.manage');
        
        if (!$isManager) {
            $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
            if ($alloc->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your class.'], 403);
        }

        $assessment = Assessment::create([
            'allocation_id' => $alloc->id,
            'type' => $req['type'],
            'title' => $req['title'],
            'total_marks' => $req['totalMarks'],
            'held_on' => $request->heldOn ? Carbon::parse($request->heldOn) : null
        ]);

        return response()->json(['assessment' => $assessment], 201);
    }

    public function destroy(Request $request, $id)
    {
        $assessment = Assessment::with('allocation')->findOrFail($id);
        $isManager = $request->user()->hasPermission('marks.manage');
        
        if (!$isManager) {
            $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
            if ($assessment->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your assessment.'], 403);
        }
        if ($assessment->is_published) return response()->json(['message' => 'Published assessments cannot be deleted — students can already see these marks.'], 422);

        $assessment->delete();
        return response()->json(['message' => 'Assessment deleted.']);
    }

    public function getMarks(Request $request, $id)
    {
        $assessment = Assessment::with([
            'allocation.subject',
            'allocation.classSection',
            'marks'
        ])->findOrFail($id);
        $isManager = $request->user()->hasPermission('marks.manage');
        
        if (!$isManager) {
            $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
            if ($assessment->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your assessment.'], 403);
        }

        $students = Student::where('class_section_id', $assessment->allocation->class_section_id)
            ->where('status', 'active')
            ->orderBy('roll_number', 'asc')
            ->get();

        $studentMarks = $students->map(function($s) use ($assessment) {
            $mark = $assessment->marks->where('student_id', $s->id)->first();
            return [
                'id' => $s->id,
                'rollNumber' => $s->roll_number,
                'name' => $s->name,
                'obtained' => $mark ? $mark->obtained : null
            ];
        });

        return response()->json([
            'assessment' => $assessment,
            'students' => $studentMarks
        ]);
    }

    public function saveMarks(Request $request, $id)
    {
        $req = $request->validate([
            'marks' => 'required|array'
        ]);

        $assessment = Assessment::with('allocation')->findOrFail($id);
        $isManager = $request->user()->hasPermission('marks.manage');
        
        if (!$isManager) {
            $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
            if ($assessment->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your assessment.'], 403);
        }

        foreach ($req['marks'] as $m) {
            $obtained = isset($m['obtained']) && $m['obtained'] !== '' ? (float)$m['obtained'] : null;
            if ($obtained !== null && $obtained > $assessment->total_marks) {
                return response()->json(['message' => "Obtained marks cannot exceed total ({$assessment->total_marks})."], 422);
            }
        }

        DB::transaction(function() use ($assessment, $req) {
            foreach ($req['marks'] as $m) {
                $obtained = isset($m['obtained']) && $m['obtained'] !== '' ? (float)$m['obtained'] : null;
                AssessmentMark::updateOrCreate(
                    ['assessment_id' => $assessment->id, 'student_id' => $m['studentId']],
                    ['obtained' => $obtained]
                );
            }
        });

        return response()->json(['message' => 'Marks saved.']);
    }

    public function publish(Request $request, $id)
    {
        $assessment = Assessment::with('allocation.subject')->findOrFail($id);
        $isManager = $request->user()->hasPermission('marks.manage');
        
        if (!$isManager) {
            $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
            if ($assessment->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your assessment.'], 403);
        }

        $assessment->update(['is_published' => true]);

        $students = Student::where('class_section_id', $assessment->allocation->class_section_id)->get();
        foreach ($students as $s) {
            NotifyService::notify($s->user_id, 'marks', "Marks published: {$assessment->title}", "{$assessment->allocation->subject->title} — check your marks on the portal.", '/portal/marks');
        }

        return response()->json(['assessment' => $assessment]);
    }

    public function getMine(Request $request)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $marks = AssessmentMark::with(['assessment.allocation.subject'])
            ->where('student_id', $student->id)
            ->whereHas('assessment', fn($q) => $q->where('is_published', true))
            ->orderBy('id', 'desc')
            ->get();

        $formatted = $marks->map(function($m) {
            $subj = $m->assessment->allocation->subject;
            return [
                'id' => $m->id,
                'subjectId' => $subj->id ?? null,
                'subject' => $subj->title ?? '',
                'creditHours' => $subj->credit_hours ?? 3,
                'title' => $m->assessment->title,
                'type' => $m->assessment->type,
                'obtained' => $m->obtained,
                'total' => $m->assessment->total_marks,
                'heldOn' => $m->assessment->held_on
            ];
        });

        return response()->json(['marks' => $formatted]);
    }

    public function getAwardList(Request $request, $id)
    {
        $assessment = Assessment::with([
            'allocation.subject', 'allocation.teacher', 'allocation.classSection.program',
            'marks.student'
        ])->findOrFail($id);

        $roles = $request->user()->roles->pluck('name')->toArray();
        $isStaff = in_array('clerk', $roles) || in_array('admin', $roles) || in_array('principal', $roles);

        if (!$isStaff) {
            $teacher = Teacher::where('user_id', $request->user()->id)->first();
            if (!$teacher || $assessment->allocation->teacher_id !== $teacher->id) {
                return response()->json(['message' => 'Not your class.'], 403);
            }
        }

        return response()->json(['assessment' => $assessment]);
    }
}

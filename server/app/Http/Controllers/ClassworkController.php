<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use App\Models\Classwork;
use App\Models\ClassworkSubmission;
use App\Models\Allocation;
use App\Models\Teacher;
use App\Models\Student;
use App\Services\NotifyService;

class ClassworkController extends Controller
{
    public function index(Request $request)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        
        $classworks = Classwork::with([
            'allocation.subject',
            'allocation.classSection.program.department'
        ])
        ->withCount('submissions')
        ->whereHas('allocation', function($q) use ($teacher) {
            $q->where('teacher_id', $teacher->id);
        })
        ->orderBy('id', 'desc')
        ->get();

        return response()->json(['classworks' => $classworks]);
    }

    private function parseQuizQuestions($raw)
    {
        $questions = is_string($raw) ? json_decode($raw, true) : $raw;
        if (!is_array($questions) || empty($questions)) {
            throw new \Exception('Add at least one question to the quiz.', 422);
        }

        $parsed = [];
        foreach ($questions as $i => $q) {
            $text = trim($q['text'] ?? '');
            $options = isset($q['options']) && is_array($q['options']) ? array_map('trim', $q['options']) : [];
            $correct = isset($q['correct']) ? (int)$q['correct'] : -1;

            if (empty($text)) throw new \Exception("Question " . ($i + 1) . ": text is required.", 422);
            if (count($options) < 2 || count($options) > 6 || in_array('', $options, true)) {
                throw new \Exception("Question " . ($i + 1) . ": provide 2–6 non-empty options.", 422);
            }
            if ($correct < 0 || $correct >= count($options)) {
                throw new \Exception("Question " . ($i + 1) . ": mark which option is correct.", 422);
            }
            $parsed[] = ['text' => $text, 'options' => $options, 'correct' => $correct];
        }
        return $parsed;
    }

    public function store(Request $request)
    {
        $req = $request->validate([
            'allocationId' => 'required|integer',
            'type' => 'required|string',
            'title' => 'required|string'
        ]);

        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $alloc = Allocation::with(['subject', 'classSection'])->findOrFail($req['allocationId']);
        
        if ($alloc->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your class.'], 403);

        $questions = null;
        if ($req['type'] === 'quiz' && $request->has('questions')) {
            try {
                $questions = $this->parseQuizQuestions($request->questions);
            } catch (\Exception $e) {
                return response()->json(['message' => $e->getMessage()], $e->getCode() ?: 422);
            }
            if (!$request->dueAt) return response()->json(['message' => 'An online quiz needs a deadline (due date/time).'], 422);
        }

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('classwork', 'private');
        }

        $totalMarks = $questions ? count($questions) : ($request->totalMarks ? (int)$request->totalMarks : null);
        $dueAt = $request->dueAt ? Carbon::parse($request->dueAt) : null;
        $isPublished = filter_var($request->isPublished, FILTER_VALIDATE_BOOLEAN);

        $classwork = Classwork::create([
            'allocation_id' => $alloc->id,
            'type' => $req['type'],
            'title' => $req['title'],
            'instructions' => $request->instructions ?: null,
            'attachment_path' => $attachmentPath,
            'questions' => $questions,
            'total_marks' => $totalMarks,
            'due_at' => $dueAt,
            'is_published' => $isPublished
        ]);

        if ($classwork->is_published) {
            $students = Student::where('class_section_id', $alloc->class_section_id)->get();
            foreach ($students as $s) {
                $dueStr = $dueAt ? " — due " . $dueAt->format('Y-m-d H:i:s') : "";
                NotifyService::notify($s->user_id, 'classwork', "New {$classwork->type}: {$classwork->title}", "{$alloc->subject->title}{$dueStr}", '/portal/classwork');
            }
        }

        return response()->json(['classwork' => $classwork], 201);
    }

    public function destroy(Request $request, $id)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $classwork = Classwork::with(['allocation', 'submissions'])->findOrFail($id);
        
        if ($classwork->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your classwork.'], 403);

        $files = array_filter(array_merge(
            [$classwork->attachment_path],
            $classwork->submissions->pluck('file_path')->toArray()
        ));

        foreach ($files as $f) {
            Storage::disk('private')->delete($f);
        }

        $classwork->delete();
        return response()->json(['message' => 'Classwork deleted.']);
    }

    public function getSubmissions(Request $request, $id)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $classwork = Classwork::with([
            'allocation.subject', 'allocation.classSection',
            'submissions.student'
        ])->findOrFail($id);
        
        if ($classwork->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your classwork.'], 403);
        
        return response()->json(['classwork' => $classwork]);
    }

    public function gradeSubmission(Request $request, $id)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $submission = ClassworkSubmission::with('classwork.allocation')->findOrFail($id);
        
        if ($submission->classwork->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your classwork.'], 403);

        $obtained = $request->obtained !== null && $request->obtained !== '' ? (float)$request->obtained : null;
        if ($obtained !== null && $submission->classwork->total_marks && $obtained > $submission->classwork->total_marks) {
            return response()->json(['message' => "Marks cannot exceed total ({$submission->classwork->total_marks})."], 422);
        }

        $submission->update([
            'obtained' => $obtained,
            'feedback' => $request->feedback ?: null
        ]);

        return response()->json(['submission' => $submission]);
    }

    public function getMine(Request $request)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $classworks = Classwork::with([
            'allocation.subject',
            'submissions' => fn($q) => $q->where('student_id', $student->id)
        ])
        ->where('is_published', true)
        ->whereHas('allocation', fn($q) => $q->where('class_section_id', $student->class_section_id))
        ->orderBy('id', 'desc')
        ->get();

        $formatted = $classworks->map(function($c) {
            $isOverdue = $c->due_at ? Carbon::now()->isAfter(Carbon::parse($c->due_at)) : false;
            return [
                'id' => $c->id,
                'type' => $c->type,
                'title' => $c->title,
                'instructions' => $c->instructions,
                'subject' => $c->allocation->subject->title ?? '',
                'totalMarks' => $c->total_marks,
                'dueAt' => $c->due_at,
                'hasAttachment' => !empty($c->attachment_path),
                'overdue' => $isOverdue,
                'isOnlineQuiz' => !empty($c->questions),
                'questionCount' => !empty($c->questions) ? count($c->questions) : null,
                'submission' => $c->submissions->first()
            ];
        });

        return response()->json(['classworks' => $formatted]);
    }

    public function attemptQuiz(Request $request, $id)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $classwork = Classwork::with('allocation.subject')->findOrFail($id);
        
        if (!$classwork->is_published || empty($classwork->questions) || $classwork->allocation->class_section_id !== $student->class_section_id) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        $existing = ClassworkSubmission::where('classwork_id', $classwork->id)->where('student_id', $student->id)->first();
        if ($existing) return response()->json(['message' => 'You have already attempted this quiz.'], 422);

        if ($classwork->due_at && Carbon::now()->isAfter(Carbon::parse($classwork->due_at))) {
            return response()->json(['message' => 'The deadline has passed — the quiz is closed.'], 422);
        }

        $questionsWithoutAnswers = array_map(function($q) {
            return ['text' => $q['text'], 'options' => $q['options']];
        }, $classwork->questions);

        return response()->json([
            'quiz' => [
                'id' => $classwork->id,
                'title' => $classwork->title,
                'instructions' => $classwork->instructions,
                'subject' => $classwork->allocation->subject->title ?? '',
                'totalMarks' => $classwork->total_marks,
                'dueAt' => $classwork->due_at,
                'questions' => $questionsWithoutAnswers
            ]
        ]);
    }

    public function submitQuiz(Request $request, $id)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $classwork = Classwork::with('allocation')->findOrFail($id);
        
        if (!$classwork->is_published || empty($classwork->questions) || $classwork->allocation->class_section_id !== $student->class_section_id) {
            return response()->json(['message' => 'Quiz not found.'], 404);
        }

        if ($classwork->due_at && Carbon::now()->isAfter(Carbon::parse($classwork->due_at))) {
            return response()->json(['message' => 'The deadline has passed — the quiz is closed.'], 422);
        }

        $answers = $request->answers;
        if (!is_array($answers) || count($answers) !== count($classwork->questions)) {
            return response()->json(['message' => 'Answer every question before submitting.'], 422);
        }

        $normalized = array_map(function($a) {
            return ($a === null || $a === '') ? null : (int)$a;
        }, $answers);

        $obtained = 0;
        foreach ($classwork->questions as $i => $q) {
            if ($normalized[$i] === $q['correct']) $obtained++;
        }

        try {
            $submission = ClassworkSubmission::create([
                'classwork_id' => $classwork->id,
                'student_id' => $student->id,
                'answers' => $normalized,
                'submitted_at' => Carbon::now(),
                'obtained' => $obtained
            ]);
            return response()->json(['submission' => $submission, 'result' => ['obtained' => $obtained, 'total' => count($classwork->questions)]], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') return response()->json(['message' => 'You have already attempted this quiz.'], 422);
            throw $e;
        }
    }

    public function submitWork(Request $request, $id)
    {
        if (!$request->hasFile('file')) return response()->json(['message' => 'A file is required.'], 422);

        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $classwork = Classwork::with('allocation')->findOrFail($id);
        
        if (!$classwork->is_published || $classwork->allocation->class_section_id !== $student->class_section_id) {
            return response()->json(['message' => 'Classwork not found.'], 404);
        }

        if (!empty($classwork->questions)) {
            return response()->json(['message' => 'This is an online quiz — attempt it in the portal instead of uploading a file.'], 422);
        }

        if ($classwork->due_at && Carbon::now()->isAfter(Carbon::parse($classwork->due_at))) {
            return response()->json(['message' => 'The due time has passed — submissions are closed.'], 422);
        }

        $filePath = $request->file('file')->store('classwork', 'private');

        $submission = ClassworkSubmission::updateOrCreate(
            ['classwork_id' => $classwork->id, 'student_id' => $student->id],
            ['file_path' => $filePath, 'submitted_at' => Carbon::now()]
        );

        return response()->json(['submission' => $submission], 201);
    }

    public function downloadAttachment(Request $request, $id)
    {
        $classwork = Classwork::with('allocation')->findOrFail($id);
        if (!$classwork->attachment_path) return response()->json(['message' => 'No attachment.'], 404);

        $student = Student::where('user_id', $request->user()->id)->first();
        $isSectionStudent = $student && $classwork->is_published && $student->class_section_id === $classwork->allocation->class_section_id;
        
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        $isOwningTeacher = $teacher && $classwork->allocation->teacher_id === $teacher->id;
        
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isPrincipal = in_array('principal', $roles);

        if (!$isSectionStudent && !$isOwningTeacher && !$isPrincipal) {
            return response()->json(['message' => 'Not allowed.'], 403);
        }

        $path = storage_path("app/private/" . $classwork->attachment_path);
        if (!file_exists($path)) return response()->json(['message' => 'File missing.'], 404);

        return response()->download($path);
    }

    public function downloadSubmission(Request $request, $id)
    {
        $submission = ClassworkSubmission::with(['student', 'classwork.allocation'])->findOrFail($id);
        if (!$submission->file_path) return response()->json(['message' => 'This is an online-quiz attempt — there is no file.'], 404);

        $isOwner = $submission->student->user_id === $request->user()->id;
        
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        $isTeacher = $teacher && $submission->classwork->allocation->teacher_id === $teacher->id;
        
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isStaff = in_array('principal', $roles);

        if (!$isOwner && !$isTeacher && !$isStaff) {
            return response()->json(['message' => 'Not allowed.'], 403);
        }

        $path = storage_path("app/private/" . $submission->file_path);
        if (!file_exists($path)) return response()->json(['message' => 'File missing.'], 404);

        return response()->download($path);
    }
}

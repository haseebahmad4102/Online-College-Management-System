<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Exam;
use App\Models\QuestionPaper;
use App\Models\Question;
use App\Models\Subject;
use Illuminate\Support\Facades\Gate;

class TeacherExamController extends Controller
{
    public function getActiveExams(Request $request)
    {
        if (!$request->user() || !$request->user()->hasRole('teacher')) abort(403);
        $exams = Exam::where('is_active', true)->orderBy('created_at', 'desc')->get();
        return response()->json(['exams' => $exams]);
    }

    public function getMyPapers(Request $request)
    {
        if (!$request->user() || !$request->user()->hasRole('teacher')) abort(403);
        $teacher = $request->user()->teacher;
        if (!$teacher) return response()->json(['message' => 'Not a teacher'], 403);

        $papers = QuestionPaper::with(['exam', 'subject', 'questions'])
            ->where('teacher_id', $teacher->id)
            ->get();
            
        return response()->json(['papers' => $papers]);
    }

    public function getMySubjects(Request $request)
    {
        if (!$request->user() || !$request->user()->hasRole('teacher')) abort(403);
        $teacher = $request->user()->teacher;
        if (!$teacher) return response()->json(['subjects' => []]);

        // Subjects this teacher teaches based on timetable allocations
        $allocs = \App\Models\TimetableEntry::with('subject')
            ->where('teacher_id', $teacher->id)
            ->get();
        
        $subjects = $allocs->pluck('subject')->filter()->unique('id')->values();
        
        // If timetable isn't set up, just return all subjects so they can test it
        if ($subjects->isEmpty()) {
            $subjects = Subject::all();
        }

        return response()->json(['subjects' => $subjects]);
    }

    public function createPaper(Request $request)
    {
        if (!$request->user() || !$request->user()->hasRole('teacher')) abort(403);
        $teacher = $request->user()->teacher;
        
        $req = $request->validate([
            'examId' => 'required|integer|exists:exams,id',
            'subjectId' => 'required|integer|exists:subjects,id',
            'instructions' => 'nullable|string',
            'timeAllowedMinutes' => 'nullable|integer',
            'questions' => 'required|array' // Expected array of question objects
        ], [
            'examId.exists' => 'The selected exam no longer exists. It may have been deleted by the Controller of Examinations. Please refresh the page.'
        ]);

        // Wrap in transaction to create paper + questions
        $paper = \Illuminate\Support\Facades\DB::transaction(function() use ($req, $teacher) {
            $p = QuestionPaper::create([
                'exam_id' => $req['examId'],
                'subject_id' => $req['subjectId'],
                'teacher_id' => $teacher->id,
                'status' => 'draft',
                'instructions' => $req['instructions'],
                'time_allowed_minutes' => $req['timeAllowedMinutes']
            ]);

            foreach ($req['questions'] as $i => $q) {
                Question::create([
                    'question_paper_id' => $p->id,
                    'type' => $q['type'], // mcq, short, long
                    'question_text' => $q['text'] ?? '',
                    'marks' => $q['marks'],
                    'options' => isset($q['options']) ? $q['options'] : null,
                    'sort_order' => $i
                ]);
            }
            return $p->load('questions');
        });

        return response()->json(['paper' => $paper], 201);
    }

    public function submitPaper(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->hasRole('teacher')) abort(403);
        $teacher = $request->user()->teacher;
        if (!$teacher) return response()->json(['message' => 'Not a teacher'], 403);

        $paper = QuestionPaper::where('id', $id)->where('teacher_id', $teacher->id)->firstOrFail();
        
        if ($paper->status !== 'draft') {
            return response()->json(['message' => 'Paper is already submitted.'], 422);
        }

        $paper->update(['status' => 'submitted']);
        return response()->json(['message' => 'Paper successfully submitted to the Controller Examiner.']);
    }

    public function deletePaper(Request $request, $id)
    {
        if (!$request->user() || !$request->user()->hasRole('teacher')) abort(403);
        $teacher = $request->user()->teacher;

        $paper = QuestionPaper::where('id', $id)->where('teacher_id', $teacher->id)->firstOrFail();
        
        if ($paper->status !== 'draft') {
            return response()->json(['message' => 'Cannot delete a paper that has already been submitted.'], 422);
        }

        $paper->delete();
        return response()->json(['message' => 'Draft paper deleted successfully.']);
    }
}

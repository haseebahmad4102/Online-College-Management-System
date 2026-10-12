<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use App\Models\Committee;
use App\Models\CommitteeMember;
use App\Models\CommitteeStudentMember;
use App\Models\Teacher;
use App\Models\Student;

class CommitteeController extends Controller
{
    private const MEMBER_POSITIONS = ['convener', 'secretary', 'member'];

    public function index(Request $request)
    {
        Gate::authorize('committee.view');
        
        $committees = Committee::with([
            'members.teacher.department',
            'members.teacher.designation',
            'studentMembers.student.program',
            'studentMembers.student.classSection'
        ])
        ->orderBy('name', 'asc')
        ->get();

        return response()->json(['committees' => $committees]);
    }

    public function people(Request $request)
    {
        Gate::authorize('committee.view');
        
        $q = trim($request->query('q', ''));
        
        $teachersQuery = Teacher::with(['department', 'designation'])->where('status', 'active');
        if ($q) $teachersQuery->where('name', 'like', "%{$q}%");
        
        $studentsQuery = Student::with(['program', 'classSection'])->where('status', 'active');
        if ($q) $studentsQuery->where('name', 'like', "%{$q}%");

        $teachers = $teachersQuery->orderBy('name', 'asc')->take(80)->get();
        $students = $studentsQuery->orderBy('name', 'asc')->take(80)->get();

        return response()->json([
            'teachers' => $teachers,
            'students' => $students
        ]);
    }

    public function store(Request $request)
    {
        Gate::authorize('committee.manage');
        
        $name = trim($request->name);
        if (!$name || strlen($name) < 3) {
            return response()->json(['message' => 'A committee name of at least 3 characters is required.'], 422);
        }

        $committee = Committee::create([
            'name' => $name,
            'description' => $request->description ?: null
        ]);

        $committee->load([
            'members.teacher.department',
            'members.teacher.designation',
            'studentMembers.student.program',
            'studentMembers.student.classSection'
        ]);

        return response()->json(['committee' => $committee], 201);
    }

    public function update(Request $request, $id)
    {
        Gate::authorize('committee.manage');
        
        $committee = Committee::findOrFail($id);
        
        $data = [];
        if ($request->has('name')) $data['name'] = trim($request->name);
        if ($request->has('description')) $data['description'] = $request->description ?: null;

        $committee->update($data);
        $committee->load([
            'members.teacher.department',
            'members.teacher.designation',
            'studentMembers.student.program',
            'studentMembers.student.classSection'
        ]);

        return response()->json(['committee' => $committee]);
    }

    public function destroy(Request $request, $id)
    {
        Gate::authorize('committee.manage');
        
        $committee = Committee::findOrFail($id);
        $committee->delete();
        
        return response()->json(['message' => "\"{$committee->name}\" committee deleted."]);
    }

    public function addTeacherMember(Request $request, $id)
    {
        Gate::authorize('committee.manage');
        
        $position = $request->position ?: 'member';
        if (!in_array($position, self::MEMBER_POSITIONS)) {
            return response()->json(['message' => 'Position must be convener, secretary, or member.'], 422);
        }
        
        if (!$request->teacherId) return response()->json(['message' => 'Select a teacher.'], 422);

        $committee = Committee::findOrFail($id);
        $teacher = Teacher::findOrFail($request->teacherId);
        
        if ($teacher->status !== 'active') {
            return response()->json(['message' => "{$teacher->name} is not an active teacher."], 422);
        }

        if ($position === 'convener') {
            CommitteeMember::where('committee_id', $committee->id)
                ->where('position', 'convener')
                ->where('teacher_id', '!=', $teacher->id)
                ->update(['position' => 'member']);
        }

        CommitteeMember::updateOrCreate(
            ['committee_id' => $committee->id, 'teacher_id' => $teacher->id],
            ['position' => $position]
        );

        if ($teacher->user_id) {
            \App\Models\Notification::create([
                'user_id' => $teacher->user_id,
                'type' => 'committee_assigned',
                'title' => 'Added to Committee',
                'body' => "You have been added to the \"{$committee->name}\" committee as {$position}."
            ]);
        }

        return response()->json(['message' => "{$teacher->name} added to \"{$committee->name}\" as {$position}."]);
    }

    public function removeTeacherMember(Request $request, $id, $teacherId)
    {
        Gate::authorize('committee.manage');
        
        $deleted = CommitteeMember::where('committee_id', $id)
            ->where('teacher_id', $teacherId)
            ->delete();
            
        if ($deleted === 0) return response()->json(['message' => 'That teacher is not on this committee.'], 404);
        
        return response()->json(['message' => 'Teacher removed from the committee.']);
    }

    public function addStudentMember(Request $request, $id)
    {
        Gate::authorize('committee.manage');
        
        $position = $request->position ?: 'member';
        if (!in_array($position, self::MEMBER_POSITIONS)) {
            return response()->json(['message' => 'Position must be convener, secretary, or member.'], 422);
        }
        
        if (!$request->studentId) return response()->json(['message' => 'Select a student.'], 422);

        $committee = Committee::findOrFail($id);
        $student = Student::findOrFail($request->studentId);
        
        if ($student->status !== 'active') {
            return response()->json(['message' => "{$student->name} is not an active student."], 422);
        }

        CommitteeStudentMember::updateOrCreate(
            ['committee_id' => $committee->id, 'student_id' => $student->id],
            ['position' => $position]
        );

        if ($student->user_id) {
            \App\Models\Notification::create([
                'user_id' => $student->user_id,
                'type' => 'committee_assigned',
                'title' => 'Added to Committee',
                'body' => "You have been added to the \"{$committee->name}\" committee as {$position}."
            ]);
        }

        return response()->json(['message' => "{$student->name} added to \"{$committee->name}\" as {$position}."]);
    }

    public function removeStudentMember(Request $request, $id, $studentId)
    {
        Gate::authorize('committee.manage');
        
        $deleted = CommitteeStudentMember::where('committee_id', $id)
            ->where('student_id', $studentId)
            ->delete();
            
        if ($deleted === 0) return response()->json(['message' => 'That student is not on this committee.'], 404);
        
        return response()->json(['message' => 'Student removed from the committee.']);
    }
}

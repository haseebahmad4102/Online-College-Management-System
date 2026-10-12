<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Carbon\Carbon;
use App\Models\Teacher;
use App\Models\Student;
use App\Models\Application;
use App\Models\Challan;
use App\Models\BookIssue;
use App\Models\AttendanceSheet;
use App\Models\AttendanceRecord;
use App\Models\Allocation;
use App\Models\Assessment;
use App\Models\Classwork;
use App\Models\Book;
use App\Models\BookRequest;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\TimetableEntry;
use App\Models\ClassSection;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $roles = $request->user()->roles->pluck('name')->toArray();
        $stats = [];

        if (in_array('admin', $roles) || in_array('principal', $roles) || in_array('clerk', $roles)) {
            $today = Carbon::today();
            $applications = Application::count();
            $pendingDocs = Application::where('status', 'submitted')->count();
            $enrolled = Application::where('status', 'enrolled')->count();
            $teachers = Teacher::where('status', 'active')->count();
            $students = Student::where('status', 'active')->count();
            $feeVerifiedToday = Challan::where('status', 'verified')->where('verified_at', '>=', $today)->count();
            $overdueBooks = BookIssue::whereNull('returned_on')->where('due_date', '<', Carbon::now())->count();
            
            $todaySheets = AttendanceSheet::with('records')->whereDate('date', $today)->get();
            $todayRecords = $todaySheets->flatMap->records;
            
            $todayPct = null;
            if ($todayRecords->count() > 0) {
                $presentCount = $todayRecords->where('status', '!=', 'absent')->count();
                $todayPct = round(($presentCount / $todayRecords->count()) * 100);
            }

            $stats = array_merge($stats, [
                'applications' => $applications,
                'pendingDocs' => $pendingDocs,
                'enrolled' => $enrolled,
                'teachers' => $teachers,
                'students' => $students,
                'feeVerifiedToday' => $feeVerifiedToday,
                'overdueBooks' => $overdueBooks,
                'todayAttendancePct' => $todayPct,
            ]);
        }

        if (in_array('teacher', $roles)) {
            $teacher = Teacher::where('user_id', $request->user()->id)->first();
            if ($teacher) {
                $classes = Allocation::where('teacher_id', $teacher->id)->where('is_active', true)->count();
                $assessments = Assessment::whereHas('allocation', function($q) use ($teacher) {
                    $q->where('teacher_id', $teacher->id);
                })->count();
                $classworks = Classwork::whereHas('allocation', function($q) use ($teacher) {
                    $q->where('teacher_id', $teacher->id);
                })->count();

                $stats = array_merge($stats, [
                    'classes' => $classes,
                    'assessments' => $assessments,
                    'classworks' => $classworks,
                ]);
            }
        }

        if (in_array('student', $roles)) {
            $student = Student::with(['program.level', 'classSection', 'carryForwards' => function($q) {
                $q->where('status', 'pending')->with('subject');
            }])->where('user_id', $request->user()->id)->first();

            if ($student) {
                $records = AttendanceRecord::where('student_id', $student->id)->count();
                $present = AttendanceRecord::where('student_id', $student->id)->where('status', '!=', 'absent')->count();
                
                $pendingClasswork = Classwork::where('is_published', true)
                    ->where('due_at', '>=', Carbon::now())
                    ->whereHas('allocation', function($q) use ($student) {
                        $q->where('class_section_id', $student->class_section_id ?? -1);
                    })
                    ->whereDoesntHave('submissions', function($q) use ($student) {
                        $q->where('student_id', $student->id);
                    })->count();
                
                $booksOut = BookIssue::where('student_id', $student->id)->whereNull('returned_on')->count();
                
                $termNo = $student->classSection->term_no ?? null;
                $currentClass = null;
                if ($student->status === 'passed_out') {
                    $currentClass = 'Passed out';
                } elseif ($termNo) {
                    if ($student->program->default_exam_system === 'annual') {
                        $currentClass = $termNo == 1 ? '1st Year' : ($termNo . 'th Year');
                    } else {
                        $currentClass = 'Semester ' . $termNo;
                    }
                }

                $stats = array_merge($stats, [
                    'rollNumber' => $student->roll_number,
                    'attendancePct' => $records > 0 ? round(($present / $records) * 100) : null,
                    'pendingClasswork' => $pendingClasswork,
                    'booksOut' => $booksOut,
                    'currentClass' => $currentClass,
                    'carryPapers' => $student->carryForwards->map(function($c) use ($student) {
                        $fromLabel = $student->program->level->default_exam_system === 'annual' 
                            ? ($c->from_term_no == 1 ? '1st' : '2nd') . ' Year' 
                            : 'Semester ' . $c->from_term_no;
                        return [
                            'id' => (string)$c->id,
                            'code' => $c->subject->code,
                            'title' => $c->subject->title,
                            'fromTermNo' => $c->from_term_no,
                            'fromLabel' => $fromLabel,
                        ];
                    })
                ]);
            }
        }

        if (in_array('librarian', $roles)) {
            $books = Book::where('is_active', true)->count();
            $pendingRequests = BookRequest::where('status', 'pending')->count();
            $issuesOut = BookIssue::whereNull('returned_on')->count();
            $overdue = BookIssue::whereNull('returned_on')->where('due_date', '<', Carbon::now())->count();

            $stats = array_merge($stats, [
                'books' => $books,
                'pendingRequests' => $pendingRequests,
                'issuesOut' => $issuesOut,
                'overdue' => $overdue,
            ]);
        }

        if (in_array('timetable', $roles)) {
            $rooms = Room::where('is_active', true)->count();
            $slots = TimeSlot::count();
            $entries = TimetableEntry::count();
            $sections = ClassSection::where('is_active', true)->count();

            $stats = array_merge($stats, [
                'rooms' => $rooms,
                'slots' => $slots,
                'entries' => $entries,
                'sections' => $sections,
            ]);
        }

        if (in_array('applicant', $roles)) {
            $apps = Application::with('program')->where('user_id', $request->user()->id)->get();
            $stats = array_merge($stats, [
                'myApplications' => $apps->count(),
                'applications' => $apps->map(function($a) {
                    return [
                        'id' => $a->id,
                        'no' => $a->application_no,
                        'program' => $a->program->name ?? '',
                        'status' => $a->status,
                    ];
                })
            ]);
        }

        return response()->json(['stats' => $stats]);
    }
}

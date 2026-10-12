<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use App\Models\Student;
use App\Models\Program;
use App\Models\AcademicSession;
use App\Models\Subject;
use App\Models\ClassSection;
use App\Models\StudentCarryForward;
use App\Services\SettingService;
use App\Services\NotifyService;

class PromotionController extends Controller
{
    private function finalTermOf($program)
    {
        return $program->level->default_exam_system === 'annual' ? ($program->duration_years ?? 2) : ($program->total_semesters ?? 8);
    }

    private function classLabel($level, $termNo)
    {
        if ($level->default_exam_system === 'annual') {
            if ($termNo === 1) return '1st Year';
            if ($termNo === 2) return '2nd Year';
            if ($termNo === 3) return '3rd Year';
            return "{$termNo}th Year";
        }
        return "Semester {$termNo}";
    }

    public function preview(Request $request)
    {
        Gate::authorize('students.view');
        
        $programId = (int)$request->query('programId');
        $sessionId = (int)$request->query('sessionId');
        $termNo = $request->query('termNo') ? (int)$request->query('termNo') : null;

        if (!$programId || !$sessionId) {
            return response()->json(['message' => 'Program and session (batch) are required.'], 422);
        }

        $program = Program::with('level')->findOrFail($programId);
        $session = AcademicSession::findOrFail($sessionId);

        $students = Student::with(['classSection', 'carryForwards' => fn($q) => $q->where('status', 'pending')->with('subject')])
            ->where('program_id', $programId)
            ->where('academic_session_id', $sessionId)
            ->orderBy('roll_number', 'asc')
            ->get();

        $subjects = Subject::where('program_id', $programId)
            ->where('is_active', true)
            ->orderBy('term_no', 'asc')
            ->orderBy('code', 'asc')
            ->get();

        $maxCarry = SettingService::getNumber('promotion.max_carry', 2);
        $finalTerm = $this->finalTermOf($program);

        $subjectsByTerm = [];
        foreach ($subjects as $s) {
            if (!isset($subjectsByTerm[$s->term_no])) $subjectsByTerm[$s->term_no] = [];
            $subjectsByTerm[$s->term_no][] = $s;
        }

        $byTerm = [];
        $unassigned = [];
        foreach ($students as $st) {
            if (!$st->classSection) {
                $unassigned[] = $st;
                continue;
            }
            if (!isset($byTerm[$st->classSection->term_no])) $byTerm[$st->classSection->term_no] = [];
            $byTerm[$st->classSection->term_no][] = $st;
        }

        $termNos = array_keys($byTerm);
        if ($termNo !== null && !in_array($termNo, $termNos)) {
            $termNos[] = $termNo;
        }
        sort($termNos);

        $terms = [];
        foreach ($termNos as $t) {
            if ($termNo !== null && $t !== $termNo) continue;
            $terms[] = [
                'termNo' => $t,
                'fromLabel' => $this->classLabel($program->level, $t),
                'toLabel' => $t >= $finalTerm ? 'Passed out' : $this->classLabel($program->level, $t + 1),
                'isFinalTerm' => $t >= $finalTerm,
                'subjects' => $subjectsByTerm[$t] ?? [],
                'students' => $byTerm[$t] ?? []
            ];
        }

        return response()->json([
            'program' => $program,
            'session' => $session,
            'maxCarry' => $maxCarry,
            'finalTerm' => $finalTerm,
            'terms' => $terms,
            'unassigned' => $unassigned,
            'totals' => [
                'batch' => $students->count(),
                'active' => $students->filter(fn($s) => $s->status === 'active')->count(),
                'pendingPapers' => $students->filter(fn($s) => $s->carryForwards->count() > 0)->count(),
                'unassigned' => count($unassigned)
            ]
        ]);
    }

    public function run(Request $request)
    {
        Gate::authorize('students.promote');
        
        $req = $request->validate([
            'programId' => 'required|integer',
            'sessionId' => 'required|integer',
            'termNo' => 'required|integer',
            'promotions' => 'required|array'
        ]);

        $program = Program::with('level')->findOrFail($req['programId']);
        $finalTerm = $this->finalTermOf($program);
        $termNo = $req['termNo'];
        $isFinal = $termNo >= $finalTerm;
        $maxCarry = SettingService::getNumber('promotion.max_carry', 2);

        $batch = Student::with(['classSection', 'carryForwards' => fn($q) => $q->where('status', 'pending')])
            ->where('program_id', $req['programId'])
            ->where('academic_session_id', $req['sessionId'])
            ->get();

        $inTerm = $batch->filter(fn($st) => $st->classSection && $st->classSection->term_no === $termNo);
        $studentsById = [];
        foreach ($inTerm as $st) {
            if ($st->status === 'active') $studentsById[$st->id] = ['student' => $st, 'section' => $st->classSection];
        }

        if (empty($studentsById)) {
            $noShift = $batch->filter(fn($st) => !$st->classSection)->count();
            if ($inTerm->count() > 0) {
                return response()->json(['message' => 'No active students in that semester — every student there is inactive, expelled or already passed out.'], 422);
            }
            if ($noShift > 0) {
                return response()->json(['message' => "No students sit in that semester yet. {$noShift} student(s) of this batch have no class shift assigned — assign one from the Students directory first."], 422);
            }
            return response()->json(['message' => 'No students found in that semester.'], 422);
        }

        $sections = ClassSection::where('program_id', $req['programId'])
            ->where('academic_session_id', $req['sessionId'])
            ->where('term_no', $termNo)
            ->get();

        $termSubjects = Subject::where('program_id', $req['programId'])->where('term_no', $termNo)->get();
        $termSubjectIds = $termSubjects->pluck('id')->toArray();

        $jobs = [];
        $skipped = [];
        foreach ($req['promotions'] as $p) {
            $studentId = $p['studentId'];
            if (!isset($studentsById[$studentId])) {
                $skipped[] = ['studentId' => $studentId, 'reason' => 'Not an active student of this semester.'];
                continue;
            }
            $entry = $studentsById[$studentId];
            $carryIds = array_unique(array_map('intval', $p['carrySubjectIds'] ?? []));

            if (count($carryIds) > $maxCarry) {
                $skipped[] = ['studentId' => $studentId, 'name' => $entry['student']->name, 'reason' => "More than {$maxCarry} failed subjects — must repeat the semester (detained)."];
                continue;
            }

            $invalidCarries = array_diff($carryIds, $termSubjectIds);
            if (!empty($invalidCarries)) {
                $skipped[] = ['studentId' => $studentId, 'name' => $entry['student']->name, 'reason' => 'Carry subjects must belong to this semester.'];
                continue;
            }

            if ($isFinal && (count($carryIds) > 0 || $entry['student']->carryForwards->count() > 0)) {
                $skipped[] = ['studentId' => $studentId, 'name' => $entry['student']->name, 'reason' => 'Cannot pass out with pending papers — clear them first.'];
                continue;
            }

            $jobs[] = ['student' => $entry['student'], 'section' => $entry['section'], 'carryIds' => $carryIds];
        }

        $result = DB::transaction(function() use ($jobs, $isFinal, $termNo, $sections) {
            $promoted = 0;
            $passedOut = 0;
            $targetBySection = [];

            foreach ($jobs as $job) {
                $student = $job['student'];
                $section = $job['section'];

                if ($isFinal) {
                    $student->update(['status' => 'passed_out']);
                    $passedOut++;
                    continue;
                }

                $key = $section->id;
                if (!isset($targetBySection[$key])) {
                    $target = ClassSection::where([
                        'program_id' => $section->program_id,
                        'academic_session_id' => $section->academic_session_id,
                        'term_no' => $termNo + 1,
                        'name' => $section->name
                    ])->first();

                    if (!$target) {
                        $target = ClassSection::create([
                            'program_id' => $section->program_id,
                            'academic_session_id' => $section->academic_session_id,
                            'term_no' => $termNo + 1,
                            'name' => $section->name,
                            'shift' => $section->shift,
                            'capacity' => $section->capacity,
                            'is_active' => true
                        ]);
                    } elseif (!$target->is_active) {
                        $target->update(['is_active' => true]);
                    }
                    $targetBySection[$key] = $target;
                }

                $student->update(['class_section_id' => $targetBySection[$key]->id]);

                foreach ($job['carryIds'] as $subjectId) {
                    StudentCarryForward::updateOrCreate(
                        ['student_id' => $student->id, 'subject_id' => $subjectId],
                        [
                            'status' => 'pending',
                            'from_term_no' => $termNo,
                            'cleared_by' => null,
                            'cleared_at' => null
                        ]
                    );
                }
                $promoted++;
            }

            foreach ($sections as $s) {
                $remaining = Student::where('class_section_id', $s->id)->where('status', 'active')->count();
                if ($remaining === 0) {
                    $s->update(['is_active' => false]);
                }
            }

            return ['promoted' => $promoted, 'passedOut' => $passedOut];
        });

        $subjectById = $termSubjects->keyBy('id');
        foreach ($jobs as $job) {
            $student = $job['student'];
            $label = $isFinal ? null : $this->classLabel($program->level, $termNo + 1);
            
            $carryNote = '';
            if (count($job['carryIds']) > 0) {
                $names = array_map(fn($id) => isset($subjectById[$id]) ? $subjectById[$id]->title : $id, $job['carryIds']);
                $carryNote = " Carry papers to re-sit with the junior batch: " . implode(', ', $names) . ".";
            }

            $title = $isFinal ? 'Congratulations — you have completed your program!' : "Promoted to {$label}";
            $body = $isFinal 
                ? "You have passed out of {$program->name}. Best wishes from GGCM!"
                : "You have been promoted to {$label} ({$program->name}).{$carryNote}";

            NotifyService::notify($student->user_id, 'academic', $title, $body, '/portal');
        }

        $detained = count($studentsById) - count($jobs) - count($skipped);
        return response()->json(array_merge($result, ['detained' => $detained, 'skipped' => $skipped]));
    }

    public function getCarries(Request $request)
    {
        Gate::authorize('students.view');
        
        $status = $request->query('status', 'pending');
        $q = StudentCarryForward::with([
            'student.program', 'student.classSection', 'subject'
        ]);

        if ($status !== 'all') {
            $q->where('status', $status);
        }
        if ($request->query('programId')) {
            $q->whereHas('student', fn($query) => $query->where('program_id', (int)$request->query('programId')));
        }

        $carries = $q->orderBy('id', 'desc')->get();
        return response()->json(['carries' => $carries]);
    }

    public function clearCarry(Request $request, $id)
    {
        Gate::authorize('students.promote');
        
        $carry = StudentCarryForward::with(['student', 'subject'])->findOrFail($id);
        $carry->update([
            'status' => 'cleared',
            'cleared_by' => $request->user()->id,
            'cleared_at' => now()
        ]);

        NotifyService::notify($carry->student->user_id, 'academic', 'Carry paper cleared', "Your {$carry->subject->title} paper has been marked cleared. Congratulations!", '/portal');

        return response()->json(['carry' => $carry]);
    }

    public function destroyCarry(Request $request, $id)
    {
        Gate::authorize('students.promote');
        
        StudentCarryForward::where('id', $id)->delete();
        return response()->json(['message' => 'Carry paper removed.']);
    }
}

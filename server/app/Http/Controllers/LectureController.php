<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Lecture;
use App\Models\LectureProgress;
use App\Models\Classwork;
use App\Models\ClassworkSubmission;
use App\Models\Allocation;
use App\Models\Teacher;
use App\Models\Student;
use App\Services\NotifyService;

class LectureController extends Controller
{
    private const COMPLETE_AT = 0.95;

    public static function extractYouTubeId($input)
    {
        $raw = trim((string)$input);
        if (preg_match('/^[A-Za-z0-9_-]{11}$/', $raw)) return $raw;
        if (preg_match('/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/', $raw, $m)) {
            return $m[1];
        }
        return null;
    }

    private function formatLectureList($l)
    {
        return [
            'id' => $l->id,
            'title' => $l->title,
            'description' => $l->description,
            'youtubeId' => $l->youtube_id,
            'allocationId' => $l->allocation_id,
            'durationMins' => $l->duration_mins,
            'durationSec' => $l->duration_sec,
            'isPublished' => (bool)$l->is_published,
            'strictTracking' => (bool)$l->strict_tracking,
            'quizId' => $l->quiz_id,
            'quiz' => $l->quiz ? [
                'id' => $l->quiz->id,
                'title' => $l->quiz->title,
                'totalMarks' => $l->quiz->total_marks,
                'isPublished' => $l->quiz->is_published
            ] : null,
            'createdAt' => $l->created_at,
            'subject' => $l->allocation && $l->allocation->subject ? [
                'code' => $l->allocation->subject->code,
                'title' => $l->allocation->subject->title
            ] : null,
            'section' => $l->allocation && $l->allocation->classSection ? [
                'termNo' => $l->allocation->classSection->term_no,
                'shift' => $l->allocation->classSection->shift,
                'name' => $l->allocation->classSection->name
            ] : null
        ];
    }

    private function formatProgress($p, $durationSec)
    {
        if (!$p) return null;
        $pct = null;
        if ($durationSec > 0) {
            $pct = min(100, round(($p->furthest_sec / $durationSec) * 100));
        }
        return [
            'watchedSec' => $p->watched_sec,
            'furthestSec' => $p->furthest_sec,
            'lastPosSec' => $p->last_pos_sec,
            'sessions' => $p->sessions,
            'completedAt' => $p->completed_at,
            'percent' => $pct
        ];
    }

    private function notifySection($alloc, $lecture)
    {
        $students = Student::where('class_section_id', $alloc->class_section_id)
            ->where('status', 'active')
            ->get();
            
        foreach ($students as $s) {
            NotifyService::notify($s->user_id, 'classwork', 'New recorded lecture', "“{$lecture->title}” has been posted for your class.", '/portal/lectures');
        }
    }

    public function getMineTeacher(Request $request)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        
        $lectures = Lecture::with([
            'allocation.subject', 'allocation.classSection', 'quiz'
        ])
        ->whereHas('allocation', fn($q) => $q->where('teacher_id', $teacher->id))
        ->orderBy('id', 'desc')
        ->get();

        $formatted = $lectures->map(fn($l) => $this->formatLectureList($l));
        return response()->json(['lectures' => $formatted]);
    }

    public function store(Request $request)
    {
        $req = $request->validate([
            'allocationId' => 'required|integer',
            'title' => 'required|string',
            'youtubeUrl' => 'required|string'
        ]);

        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $alloc = Allocation::with(['subject', 'classSection'])->findOrFail($req['allocationId']);
        
        if ($alloc->teacher_id !== $teacher->id) return response()->json(['message' => 'Not your class.'], 403);

        $youtubeId = self::extractYouTubeId($req['youtubeUrl']);
        if (!$youtubeId) return response()->json(['message' => 'That does not look like a YouTube link or video id. Paste the link from the address bar, or the 11-character id.'], 422);

        $quizId = null;
        if ($request->filled('quizId')) {
            $quiz = Classwork::findOrFail($request->quizId);
            if ($quiz->allocation_id !== $alloc->id) {
                return response()->json(['message' => 'The follow-up quiz must belong to the same class.'], 422);
            }
            $quizId = $quiz->id;
        }

        $lecture = Lecture::create([
            'allocation_id' => $alloc->id,
            'title' => trim($req['title']),
            'description' => $request->description ? trim($request->description) : null,
            'youtube_id' => $youtubeId,
            'duration_mins' => $request->durationMins ? (int)$request->durationMins : null,
            'quiz_id' => $quizId,
            'is_published' => filter_var($request->isPublished, FILTER_VALIDATE_BOOLEAN),
            'strict_tracking' => filter_var($request->strictTracking, FILTER_VALIDATE_BOOLEAN),
            'posted_by' => $request->user()->id
        ]);

        $lecture->load(['allocation.subject', 'allocation.classSection', 'quiz']);

        if ($lecture->is_published) {
            $this->notifySection($alloc, $lecture);
        }

        return response()->json(['lecture' => $this->formatLectureList($lecture)], 201);
    }

    public function update(Request $request, $id)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $lecture = Lecture::with(['allocation.subject', 'allocation.classSection', 'quiz'])->findOrFail($id);
        
        if ($lecture->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Lecture not found.'], 404);

        $data = [];
        if ($request->has('title')) $data['title'] = trim($request->title);
        if ($request->has('description')) $data['description'] = trim($request->description) ?: null;
        if ($request->has('youtubeUrl')) {
            $youtubeId = self::extractYouTubeId($request->youtubeUrl);
            if (!$youtubeId) return response()->json(['message' => 'That does not look like a YouTube link or video id.'], 422);
            $data['youtube_id'] = $youtubeId;
        }
        if ($request->has('durationMins')) $data['duration_mins'] = $request->durationMins ? (int)$request->durationMins : null;
        if ($request->has('isPublished')) $data['is_published'] = filter_var($request->isPublished, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('strictTracking')) $data['strict_tracking'] = filter_var($request->strictTracking, FILTER_VALIDATE_BOOLEAN);
        if ($request->has('quizId')) $data['quiz_id'] = $request->quizId ? (int)$request->quizId : null;

        $wasPublished = $lecture->is_published;
        $lecture->update($data);
        $lecture->refresh();

        if (!$wasPublished && $lecture->is_published) {
            $this->notifySection($lecture->allocation, $lecture);
        }

        return response()->json(['lecture' => $this->formatLectureList($lecture)]);
    }

    public function destroy(Request $request, $id)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $lecture = Lecture::with('allocation')->findOrFail($id);
        
        if ($lecture->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Lecture not found.'], 404);

        $lecture->delete();
        return response()->json(['message' => 'Lecture removed.']);
    }

    public function getMineStudent(Request $request)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        if (!$student->class_section_id) return response()->json(['lectures' => []]);

        $lectures = Lecture::with(['allocation.subject', 'allocation.classSection', 'quiz'])
            ->where('is_published', true)
            ->whereHas('allocation', fn($q) => $q->where('class_section_id', $student->class_section_id))
            ->orderBy('id', 'desc')
            ->get();

        $lectureIds = $lectures->pluck('id');
        $progress = LectureProgress::where('student_id', $student->id)->whereIn('lecture_id', $lectureIds)->get()->keyBy('lecture_id');
        
        $quizIds = $lectures->pluck('quiz_id')->filter();
        $subs = $quizIds->count() > 0 
            ? ClassworkSubmission::where('student_id', $student->id)->whereIn('classwork_id', $quizIds)->get()->keyBy('classwork_id')
            : collect();

        $formatted = $lectures->map(function($l) use ($progress, $subs) {
            $data = $this->formatLectureList($l);
            $p = $progress->get($l->id);
            $sub = $l->quiz_id ? $subs->get($l->quiz_id) : null;
            
            $data['progress'] = $this->formatProgress($p, $l->duration_sec);
            $data['quizDone'] = $l->quiz_id ? ($sub !== null) : null;
            $data['quizScore'] = ($sub && $sub->obtained !== null) ? (float)$sub->obtained : null;
            
            return $data;
        });

        return response()->json(['lectures' => $formatted]);
    }

    public function play(Request $request, $id)
    {
        $lecture = Lecture::with(['allocation.subject', 'allocation.classSection', 'quiz'])->findOrFail($id);

        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->first();
        
        $teacher = Teacher::where('user_id', $request->user()->id)->first();
        
        $roles = $request->user()->roles->pluck('name')->toArray();
        $isPrincipal = in_array('principal', $roles);
        
        $isOwningTeacher = $teacher && $lecture->allocation->teacher_id === $teacher->id;
        $isSectionStudent = $student && $student->status === 'active' && $student->class_section_id === $lecture->allocation->class_section_id && $lecture->is_published;

        if (!$isOwningTeacher && !$isSectionStudent && !$isPrincipal) {
            return response()->json(['message' => 'This lecture belongs to another class.'], 403);
        }

        $data = $this->formatLectureList($lecture);
        $data['youtubeId'] = $lecture->youtube_id;

        return response()->json(['lecture' => $data]);
    }

    public function reportProgress(Request $request, $id)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $lecture = Lecture::with('allocation')->findOrFail($id);
        if (!$lecture->is_published) return response()->json(['message' => 'Lecture not found.'], 404);
        if ($student->class_section_id !== $lecture->allocation->class_section_id) {
            return response()->json(['message' => 'This lecture belongs to another class.'], 403);
        }

        $pos = max(0, floor((float)($request->positionSec ?: 0)));
        $dur = max(0, floor((float)($request->durationSec ?: $lecture->duration_sec ?: 0)));

        $existing = LectureProgress::where('lecture_id', $lecture->id)->where('student_id', $student->id)->first();

        $gapSec = $existing ? (Carbon::now()->diffInSeconds(Carbon::parse($existing->last_seen_at))) + 5 : 60;
        $claimed = max(0, floor((float)($request->playedSec ?: 0)));
        $credited = min($claimed, ceil($gapSec));

        $furthest = max($existing ? $existing->furthest_sec : 0, $dur ? min($pos, $dur) : $pos);
        $watched = ($existing ? $existing->watched_sec : 0) + $credited;
        
        $ended = filter_var($request->ended, FILTER_VALIDATE_BOOLEAN);
        $reachedEnd = $ended || ($dur > 0 && $furthest >= floor($dur * self::COMPLETE_AT));

        if ($lecture->strict_tracking) {
            $finished = ($dur > 0 && $watched >= floor($dur * self::COMPLETE_AT));
        } else {
            $finished = $reachedEnd;
        }

        $completedAt = $existing && $existing->completed_at ? $existing->completed_at : ($finished ? Carbon::now() : null);
        
        // Notify if they reached the end but skipped parts of it (under strict tracking)
        if ($lecture->strict_tracking && $reachedEnd && !$finished) {
            $notifiedSkip = $existing ? $existing->notified_skip : false;
            if (!$notifiedSkip) {
                NotifyService::notify($student->user_id, 'system', 'Lecture Incomplete', "You reached the end of “{$lecture->title}”, but haven't watched the full video. Skipping is not allowed. Please watch it completely.", '/portal/lectures');
            }
        }

        $sessions = $existing ? $existing->sessions : 0;
        $newAttempt = filter_var($request->newAttempt, FILTER_VALIDATE_BOOLEAN);
        
        if (!$existing) {
            $sessions = 1;
        } elseif ($gapSec > 300 || $newAttempt) {
            $sessions++;
            // If they forced a new attempt via "Watch Again", don't credit them any time for this initial ping.
            if ($newAttempt) {
                $credited = 0; 
                $watched = $existing->watched_sec; // no additional time
                $furthest = $existing->furthest_sec; 
            }
        }

        $progress = LectureProgress::updateOrCreate(
            ['lecture_id' => $lecture->id, 'student_id' => $student->id],
            [
                'watched_sec' => $watched,
                'furthest_sec' => $furthest,
                'last_pos_sec' => $pos,
                'sessions' => $sessions,
                'completed_at' => $completedAt,
                'last_seen_at' => Carbon::now(),
                'notified_skip' => ($lecture->strict_tracking && $reachedEnd && !$finished) ? true : ($existing ? $existing->notified_skip : false)
            ]
        );

        $sessionRecord = \App\Models\LectureSession::firstOrCreate([
            'lecture_id' => $lecture->id,
            'student_id' => $student->id,
            'session_number' => $sessions
        ]);
        $sessionRecord->watched_sec += $credited;
        $sessionRecord->furthest_sec = max($sessionRecord->furthest_sec, $dur ? min($pos, $dur) : $pos);
        $sessionRecord->save();

        if ($dur > 0 && !$lecture->duration_sec) {
            $lecture->update(['duration_sec' => $dur]);
        }

        return response()->json(['progress' => $this->formatProgress($progress, $dur ?: $lecture->duration_sec)]);
    }

    public function getProgress(Request $request, $id)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student"));
        if (!$student) $student = Student::where('user_id', $request->user()->id)->firstOrFail();

        $lecture = Lecture::findOrFail($id);
        $p = LectureProgress::where('lecture_id', $lecture->id)->where('student_id', $student->id)->first();
        
        return response()->json(['progress' => $p ? $this->formatProgress($p, $lecture->duration_sec) : null]);
    }

    public function getReport(Request $request, $id)
    {
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $lecture = Lecture::with(['allocation.subject', 'allocation.classSection', 'quiz'])->findOrFail($id);
        
        if ($lecture->allocation->teacher_id !== $teacher->id) return response()->json(['message' => 'Lecture not found.'], 404);

        $students = Student::where('class_section_id', $lecture->allocation->class_section_id)
            ->where('status', 'active')
            ->orderBy('roll_number', 'asc')
            ->get();
            
        $progress = LectureProgress::where('lecture_id', $lecture->id)->get()->keyBy('student_id');
        $allSessions = \App\Models\LectureSession::where('lecture_id', $lecture->id)->orderBy('session_number', 'asc')->get()->groupBy('student_id');
        
        $subs = $lecture->quiz_id 
            ? ClassworkSubmission::where('classwork_id', $lecture->quiz_id)->get()->keyBy('student_id')
            : collect();

        $dur = $lecture->duration_sec ?: 0;
        $rows = [];
        
        foreach ($students as $s) {
            $p = $progress->get($s->id);
            $sub = $subs->get($s->id);
            $studentSessions = $allSessions->get($s->id) ?? collect();
            
            $furthestPct = ($p && $dur > 0) ? min(100, round(($p->furthest_sec / $dur) * 100)) : ($p ? null : 0);
            $watchedPct = ($p && $dur > 0) ? min(100, round(($p->watched_sec / $dur) * 100)) : ($p ? null : 0);
            
            $reachedEnd = ($p && $dur > 0 && $p->furthest_sec >= floor($dur * self::COMPLETE_AT));
            $watchedFull = ($p && $dur > 0 && $p->watched_sec >= floor($dur * self::COMPLETE_AT));
            $forwarded = ($reachedEnd && !$watchedFull);

            $attempts = $studentSessions->map(function($sess) use ($dur) {
                return [
                    'sessionNumber' => $sess->session_number,
                    'watchedSec' => $sess->watched_sec,
                    'watchedPct' => $dur > 0 ? min(100, round(($sess->watched_sec / $dur) * 100)) : 0
                ];
            })->values()->toArray();

            $rows[] = [
                'studentId' => $s->id,
                'rollNumber' => $s->roll_number,
                'name' => $s->name,
                'started' => (bool)$p,
                'watchedSec' => $p ? $p->watched_sec : 0,
                'furthestPct' => $furthestPct,
                'watchedPct' => $watchedPct,
                'forwarded' => $forwarded,
                'watchedFull' => $watchedFull,
                'sessions' => $p ? $p->sessions : 0,
                'attempts' => $attempts,
                'completedAt' => $p ? $p->completed_at : null,
                'lastSeenAt' => $p ? $p->last_seen_at : null,
                'quizAttempted' => (bool)$sub,
                'quizScore' => ($sub && $sub->obtained !== null) ? (float)$sub->obtained : null,
                'quizSubmittedAt' => $sub ? $sub->submitted_at : null
            ];
        }

        $started = count(array_filter($rows, fn($r) => $r['started']));
        $completed = count(array_filter($rows, fn($r) => $r['completedAt']));
        $quizAttempted = count(array_filter($rows, fn($r) => $r['quizAttempted']));
        $completedAndQuizzed = count(array_filter($rows, fn($r) => $r['completedAt'] && $r['quizAttempted']));

        return response()->json([
            'lecture' => $this->formatLectureList($lecture),
            'durationSec' => $dur,
            'totals' => [
                'students' => count($rows),
                'started' => $started,
                'completed' => $completed,
                'quizAttempted' => $quizAttempted,
                'completedAndQuizzed' => $completedAndQuizzed
            ],
            'rows' => $rows
        ]);
    }
}

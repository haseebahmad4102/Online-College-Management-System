<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\Allocation;
use App\Models\Student;
use App\Models\AttendanceSheet;
use App\Models\AttendanceRecord;
use App\Models\Teacher;
use App\Services\SettingService;

class AttendanceController extends Controller
{
    private const EDIT_WINDOW_HOURS = 24;

    private function isLocked($sheet)
    {
        if (!$sheet) return false;
        if ($sheet->locked_at) return true;
        
        $created = Carbon::parse($sheet->created_at);
        return Carbon::now()->diffInHours($created) >= self::EDIT_WINDOW_HOURS;
    }

    public function getMyClasses(Request $request)
    {
        $q = Allocation::with([
            'subject',
            'classSection' => function($q) {
                $q->withCount('students');
                $q->with('program');
            }
        ])->where('is_active', true);

        if (!$request->user()->hasPermission('marks.manage')) {
            $teacher = Teacher::where('user_id', $request->user()->id)->first();
            if (!$teacher) return response()->json(['allocations' => []]);
            $q->where('teacher_id', $teacher->id);
        }

        return response()->json(['allocations' => $q->get()]);
    }

    public function getSheet(Request $request)
    {
        $req = $request->validate([
            'allocation' => 'required|integer',
            'date' => 'required|date'
        ]);

        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $alloc = Allocation::with(['classSection', 'subject'])->findOrFail($req['allocation']);
        
        if ($alloc->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Not your class.'], 403);
        }

        $students = Student::where('class_section_id', $alloc->class_section_id)
            ->where('status', 'active')
            ->orderBy('roll_number', 'asc')
            ->get();

        $sheetDate = Carbon::parse($req['date'])->startOfDay();
        $sheet = AttendanceSheet::with('records')
            ->where('allocation_id', $alloc->id)
            ->whereDate('date', $sheetDate)
            ->first();

        $locked = $this->isLocked($sheet);
        
        $studentRecords = $students->map(function($s) use ($sheet) {
            $status = 'present';
            if ($sheet) {
                $record = $sheet->records->where('student_id', $s->id)->first();
                if ($record) $status = $record->status;
            }
            return [
                'id' => $s->id,
                'rollNumber' => $s->roll_number,
                'name' => $s->name,
                'status' => $status
            ];
        });

        $editableUntil = $sheet ? Carbon::parse($sheet->created_at)->addHours(self::EDIT_WINDOW_HOURS)->toIso8601String() : null;

        return response()->json([
            'allocation' => $alloc,
            'students' => $studentRecords,
            'exists' => (bool) $sheet,
            'locked' => $locked,
            'editableUntil' => $editableUntil,
            'editWindowHours' => self::EDIT_WINDOW_HOURS
        ]);
    }

    public function saveSheet(Request $request)
    {
        $req = $request->validate([
            'allocationId' => 'required|integer',
            'date' => 'required|date',
            'records' => 'required|array'
        ]);

        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        $alloc = Allocation::findOrFail($req['allocationId']);
        
        if ($alloc->teacher_id !== $teacher->id) {
            return response()->json(['message' => 'Not your class.'], 403);
        }

        $sheetDate = Carbon::parse($req['date'])->startOfDay();
        if ($sheetDate->isFuture()) {
            return response()->json(['message' => 'Attendance cannot be marked for a future date.'], 422);
        }

        $existing = AttendanceSheet::where('allocation_id', $alloc->id)
            ->whereDate('date', $sheetDate)
            ->first();

        if ($this->isLocked($existing)) {
            $msg = $existing->locked_at
                ? 'This sheet has been locked. Ask the Principal to unlock it.'
                : 'This sheet was marked more than ' . self::EDIT_WINDOW_HOURS . ' hours ago and can no longer be edited. Ask the Principal to unlock it.';
            return response()->json(['message' => $msg], 422);
        }

        $sheetId = DB::transaction(function() use ($alloc, $sheetDate, $req, $request, $existing) {
            $sheet = $existing;
            if (!$sheet) {
                $sheet = AttendanceSheet::create([
                    'allocation_id' => $alloc->id,
                    'date' => $sheetDate,
                    'marked_by' => $request->user()->id
                ]);
            }

            foreach ($req['records'] as $r) {
                AttendanceRecord::updateOrCreate(
                    ['attendance_sheet_id' => $sheet->id, 'student_id' => $r['studentId']],
                    ['status' => $r['status']]
                );
            }
            
            return $sheet->id;
        });

        return response()->json(['message' => 'Attendance saved.', 'sheetId' => $sheetId]);
    }

    public function unlockSheet(Request $request, $id)
    {
        $sheet = AttendanceSheet::findOrFail($id);
        $sheet->update(['locked_at' => null]);
        return response()->json(['sheet' => $sheet]);
    }

    public function getMine(Request $request)
    {
        $student = ($request->user()->student ?? abort(403, "Not a student")); // Assuming $request->user() has student loaded or we fetch it
        if (!$student) {
            $student = Student::where('user_id', $request->user()->id)->firstOrFail();
        }

        $records = AttendanceRecord::with(['sheet.allocation.subject'])
            ->where('student_id', $student->id)
            ->get();

        $bySubject = [];
        foreach ($records as $r) {
            if (!$r->sheet || !$r->sheet->allocation || !$r->sheet->allocation->subject) continue;
            
            $key = $r->sheet->allocation->subject->title;
            if (!isset($bySubject[$key])) {
                $bySubject[$key] = ['subject' => $key, 'present' => 0, 'absent' => 0, 'leave' => 0, 'total' => 0];
            }
            $bySubject[$key][$r->status]++;
            $bySubject[$key]['total']++;
        }

        $rows = [];
        foreach ($bySubject as $s) {
            $pct = $s['total'] > 0 ? round((($s['present'] + $s['leave']) / $s['total']) * 100, 1) : 0;
            $s['percentage'] = $pct;
            $rows[] = $s;
        }

        $overall = count($rows) > 0 ? round(collect($rows)->sum('percentage') / count($rows), 1) : 0;
        
        $recent = $records->sortByDesc(fn($r) => $r->sheet->date)
            ->take(30)
            ->map(function($r) {
                return [
                    'date' => $r->sheet->date,
                    'subject' => $r->sheet->allocation->subject->title,
                    'status' => $r->status
                ];
            })->values();

        return response()->json([
            'subjects' => $rows,
            'overall' => $overall,
            'recent' => $recent
        ]);
    }

    public function reportRegister(Request $request)
    {
        $req = $request->validate([
            'allocation' => 'required|integer',
            'month' => 'required|date_format:Y-m' // e.g., 2026-08
        ]);

        $roles = $request->user()->roles->pluck('name')->toArray();
        $isStaff = in_array('admin', $roles) || in_array('principal', $roles) || $request->user()->hasPermission('attendance.reports');

        if (!$isStaff) {
            $teacher = Teacher::where('user_id', $request->user()->id)->first();
            $alloc = Allocation::find($req['allocation']);
            if (!$teacher || !$alloc || $alloc->teacher_id !== $teacher->id) {
                return response()->json(['message' => 'You may only view registers for your own classes.'], 403);
            }
        }

        $start = Carbon::createFromFormat('Y-m', $req['month'])->startOfMonth();
        $end = $start;
        $end->addMonth();

        $sheets = AttendanceSheet::with(['records.student'])
            ->where('allocation_id', $req['allocation'])
            ->where('date', '>=', $start)
            ->where('date', '<', $end)
            ->orderBy('date', 'asc')
            ->get();

        return response()->json(['sheets' => $sheets]);
    }

    public function reportShort(Request $request)
    {
        Gate::authorize('attendance.reports');

        $threshold = SettingService::getNumber('attendance.short_pct', 75);
        
        $students = Student::with(['attendanceRecords', 'program', 'classSection'])
            ->where('status', 'active')
            ->get();

        $short = [];
        foreach ($students as $s) {
            $total = $s->attendanceRecords->count();
            if ($total === 0) continue;

            $present = $s->attendanceRecords->where('status', '!=', 'absent')->count();
            $pct = round(($present / $total) * 100, 1);

            if ($pct < $threshold) {
                $short[] = [
                    'rollNumber' => $s->roll_number,
                    'name' => $s->name,
                    'program' => $s->program->code ?? '',
                    'section' => $s->classSection->name ?? '',
                    'percentage' => $pct
                ];
            }
        }

        usort($short, fn($a, $b) => $a['percentage'] <=> $b['percentage']);

        return response()->json([
            'threshold' => $threshold,
            'students' => $short
        ]);
    }
}

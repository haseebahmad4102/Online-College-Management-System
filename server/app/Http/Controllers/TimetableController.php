<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\DB;
use App\Models\Block;
use App\Models\Room;
use App\Models\TimeSlot;
use App\Models\TimetableEntry;
use App\Models\Allocation;
use App\Models\Setting;
use App\Models\Student;
use App\Models\Teacher;

class TimetableController extends Controller
{
    private const DEFAULT_SHIFT_RANGES = [
        'morning' => ['start' => '08:00', 'end' => '13:30'],
        'evening' => ['start' => '14:00', 'end' => '18:30'],
    ];

    private const RANGE_KEYS = [
        'morningStart' => 'timetable.morning_start',
        'morningEnd' => 'timetable.morning_end',
        'eveningStart' => 'timetable.evening_start',
        'eveningEnd' => 'timetable.evening_end',
    ];

    private const ROOM_LABEL = ['classroom' => 'Room', 'lab' => 'Lab'];
    private const DAY_LABELS = ['mon' => 'Monday', 'tue' => 'Tuesday', 'wed' => 'Wednesday', 'thu' => 'Thursday', 'fri' => 'Friday', 'sat' => 'Saturday'];

    private function getShiftRanges()
    {
        $keys = array_values(self::RANGE_KEYS);
        $rows = Setting::whereIn('key', $keys)->get()->keyBy('key');
        
        return [
            'morning' => [
                'start' => $rows[self::RANGE_KEYS['morningStart']]->value ?? self::DEFAULT_SHIFT_RANGES['morning']['start'],
                'end' => $rows[self::RANGE_KEYS['morningEnd']]->value ?? self::DEFAULT_SHIFT_RANGES['morning']['end'],
            ],
            'evening' => [
                'start' => $rows[self::RANGE_KEYS['eveningStart']]->value ?? self::DEFAULT_SHIFT_RANGES['evening']['start'],
                'end' => $rows[self::RANGE_KEYS['eveningEnd']]->value ?? self::DEFAULT_SHIFT_RANGES['evening']['end'],
            ],
        ];
    }

    private function validateRanges($ranges)
    {
        foreach (['morning', 'evening'] as $shift) {
            if (!preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $ranges[$shift]['start']) || 
                !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $ranges[$shift]['end'])) {
                return 'Shift times must be in HH:MM format.';
            }
            if ($ranges[$shift]['start'] >= $ranges[$shift]['end']) {
                return "{$shift} shift start time must be before end time.";
            }
        }
        if ($ranges['morning']['end'] > $ranges['evening']['start']) {
            return 'Morning shift must end before the evening shift starts.';
        }
        return null;
    }

    private function validateSlotInRange($slot, $ranges)
    {
        $shift = $slot['shift'] ?? $slot->shift;
        if (!in_array($shift, ['morning', 'evening'])) return 'Shift must be morning or evening.';
        $range = $ranges[$shift];
        $st = $slot['startTime'] ?? $slot->start_time;
        $et = $slot['endTime'] ?? $slot->end_time;
        
        if ($st < $range['start'] || $et > $range['end']) {
            return "{$shift} slot must be between {$range['start']} and {$range['end']}.";
        }
        return null;
    }

    private function roomName($blockName, $type, $n)
    {
        return $blockName . ' - ' . self::ROOM_LABEL[$type] . ' ' . $n;
    }

    private function syncRoomsForType($blockId, $blockName, $type, $target)
    {
        $existing = Room::where('block_id', $blockId)->where('type', $type)->orderBy('id', 'asc')->get();
        $keep = min($existing->count(), $target);

        for ($i = 0; $i < $keep; $i++) {
            $wanted = $this->roomName($blockName, $type, $i + 1);
            if ($existing[$i]->name !== $wanted) {
                $existing[$i]->update(['name' => $wanted]);
            }
        }

        for ($i = $target; $i < $existing->count(); $i++) {
            $inUse = TimetableEntry::where('room_id', $existing[$i]->id)->count();
            if ($inUse > 0) {
                $s = $inUse === 1 ? '' : 's';
                $l = strtolower(self::ROOM_LABEL[$type]);
                throw new \Exception("{$existing[$i]->name} has {$inUse} timetable period{$s} — remove those in the Timetable Builder before reducing {$l}s.", 422);
            }
            $existing[$i]->delete();
        }

        for ($i = $existing->count(); $i < $target; $i++) {
            Room::create([
                'block_id' => $blockId,
                'name' => $this->roomName($blockName, $type, $i + 1),
                'type' => $type
            ]);
        }
    }

    private function blockView($b)
    {
        return [
            'id' => $b->id,
            'name' => $b->name,
            'isActive' => (bool)$b->is_active,
            'classrooms' => $b->rooms->where('type', 'classroom')->count(),
            'labs' => $b->rooms->where('type', 'lab')->count(),
            'rooms' => array_values($b->rooms->sortBy('name')->toArray())
        ];
    }

    public function getBlocks(Request $request)
    {
        $blocks = Block::with('rooms')->orderBy('name', 'asc')->get();
        return response()->json(['blocks' => $blocks->map(fn($b) => $this->blockView($b))]);
    }

    public function storeBlock(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        $name = trim($request->name ?: '');
        $classrooms = (int)$request->classrooms;
        $labs = (int)$request->labs;

        if (strlen($name) < 2) return response()->json(['message' => 'Block name is required (at least 2 characters).'], 422);
        if ($classrooms < 0 || $classrooms > 100) return response()->json(['message' => 'Classrooms must be a whole number between 0 and 100.'], 422);
        if ($labs < 0 || $labs > 100) return response()->json(['message' => 'Labs must be a whole number between 0 and 100.'], 422);
        if ($classrooms + $labs < 1) return response()->json(['message' => 'Add at least one classroom or lab.'], 422);
        if (Block::where('name', $name)->exists()) return response()->json(['message' => 'A block with this name already exists.'], 422);

        try {
            $block = DB::transaction(function() use ($name, $classrooms, $labs) {
                $b = Block::create(['name' => $name]);
                $this->syncRoomsForType($b->id, $b->name, 'classroom', $classrooms);
                $this->syncRoomsForType($b->id, $b->name, 'lab', $labs);
                return Block::with('rooms')->find($b->id);
            });
            return response()->json(['block' => $this->blockView($block)], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') {
                return response()->json(['message' => 'A room with that generated name already exists — pick a different block name.'], 422);
            }
            throw $e;
        }
    }

    public function updateBlock(Request $request, $id)
    {
        Gate::authorize('timetable.manage');
        
        $current = Block::with('rooms')->find($id);
        if (!$current) return response()->json(['message' => 'Block not found.'], 404);

        $name = $request->has('name') ? trim($request->name) : $current->name;
        $classrooms = $request->has('classrooms') ? (int)$request->classrooms : $current->rooms->where('type', 'classroom')->count();
        $labs = $request->has('labs') ? (int)$request->labs : $current->rooms->where('type', 'lab')->count();
        $isActive = $request->has('isActive') ? filter_var($request->isActive, FILTER_VALIDATE_BOOLEAN) : $current->is_active;

        if (strlen($name) < 2) return response()->json(['message' => 'Block name is required (at least 2 characters).'], 422);
        if ($classrooms < 0 || $classrooms > 100) return response()->json(['message' => 'Classrooms must be a whole number between 0 and 100.'], 422);
        if ($labs < 0 || $labs > 100) return response()->json(['message' => 'Labs must be a whole number between 0 and 100.'], 422);
        if ($classrooms + $labs < 1) return response()->json(['message' => 'A block must keep at least one classroom or lab.'], 422);
        
        $clash = Block::where('name', $name)->where('id', '!=', $id)->first();
        if ($clash) return response()->json(['message' => 'Another block already uses this name.'], 422);

        try {
            $block = DB::transaction(function() use ($id, $name, $isActive, $classrooms, $labs) {
                $b = Block::find($id);
                $b->update(['name' => $name, 'is_active' => $isActive]);
                Room::where('block_id', $id)->update(['is_active' => $isActive]);
                $this->syncRoomsForType($id, $name, 'classroom', $classrooms);
                $this->syncRoomsForType($id, $name, 'lab', $labs);
                return Block::with('rooms')->find($id);
            });
            return response()->json(['block' => $this->blockView($block)]);
        } catch (\Exception $e) {
            if ($e->getCode() === 422) return response()->json(['message' => $e->getMessage()], 422);
            if (isset($e->errorInfo) && $e->getCode() === '23000') return response()->json(['message' => 'That block name collides with existing room names — choose another.'], 422);
            throw $e;
        }
    }

    public function destroyBlock(Request $request, $id)
    {
        Gate::authorize('timetable.manage');
        
        $block = Block::with('rooms')->find($id);
        if (!$block) return response()->json(['message' => 'Block not found.'], 404);

        $used = TimetableEntry::whereHas('room', fn($q) => $q->where('block_id', $id))->count();
        if ($used) {
            $s = $used === 1 ? '' : 's';
            return response()->json(['message' => "This block's rooms hold {$used} timetable period{$s}. Clear those in the Timetable Builder first."], 422);
        }

        DB::transaction(function() use ($id) {
            Room::where('block_id', $id)->delete();
            Block::where('id', $id)->delete();
        });

        $s = count($block->rooms) === 1 ? '' : 's';
        return response()->json(['message' => "Block \"{$block->name}\" and its " . count($block->rooms) . " room{$s} removed."]);
    }

    public function getRooms(Request $request)
    {
        $rooms = Room::with('block')->orderBy('name', 'asc')->get();
        return response()->json(['rooms' => $rooms]);
    }

    public function getAvailableRooms(Request $request)
    {
        $day = $request->query('day');
        $timeSlotId = (int)$request->query('timeSlotId');
        
        $slot = $timeSlotId ? TimeSlot::find($timeSlotId) : null;
        $rooms = Room::with('block')->where('is_active', true)->orderBy('name', 'asc')->get();

        if (!$day || !$slot) {
            return response()->json(['rooms' => $rooms->map(fn($r) => array_merge($r->toArray(), ['busy' => false]))]);
        }

        $excludeId = $request->query('excludeEntry') ? (int)$request->query('excludeEntry') : null;
        
        $q = TimetableEntry::with([
            'timeSlot', 
            'allocation.subject', 
            'allocation.classSection.program'
        ])->where('day', $day);
        
        if ($excludeId) $q->where('id', '!=', $excludeId);
        $sameDay = $q->get();

        $overlaps = fn($a, $b) => $a->start_time < $b->end_time && $b->start_time < $a->end_time;
        
        $busyBy = [];
        foreach ($sameDay as $e) {
            if ($overlaps($e->timeSlot, $slot)) {
                $busyBy[$e->room_id] = $e;
            }
        }

        $formatted = $rooms->map(function($r) use ($busyBy) {
            $clash = $busyBy[$r->id] ?? null;
            $data = $r->toArray();
            $data['busy'] = !!$clash;
            $data['busyWith'] = $clash ? "{$clash->allocation->classSection->program->code} Sem {$clash->allocation->classSection->term_no} · {$clash->allocation->subject->title}" : null;
            return $data;
        });

        return response()->json(['rooms' => $formatted]);
    }

    public function getShiftRangesRoute(Request $request)
    {
        return response()->json(['ranges' => $this->getShiftRanges()]);
    }

    public function updateShiftRanges(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        $ranges = [
            'morning' => [
                'start' => $request->input('morning.start', self::DEFAULT_SHIFT_RANGES['morning']['start']),
                'end' => $request->input('morning.end', self::DEFAULT_SHIFT_RANGES['morning']['end']),
            ],
            'evening' => [
                'start' => $request->input('evening.start', self::DEFAULT_SHIFT_RANGES['evening']['start']),
                'end' => $request->input('evening.end', self::DEFAULT_SHIFT_RANGES['evening']['end']),
            ]
        ];

        $error = $this->validateRanges($ranges);
        if ($error) return response()->json(['message' => $error], 422);

        $slots = TimeSlot::all();
        foreach ($slots as $slot) {
            if ($this->validateSlotInRange($slot, $ranges)) {
                return response()->json(['message' => "{$slot->name} ({$slot->start_time}-{$slot->end_time}) is outside the {$slot->shift} range. Edit or remove it first."], 422);
            }
        }

        Setting::updateOrCreate(['key' => self::RANGE_KEYS['morningStart']], ['value' => $ranges['morning']['start'], 'group' => 'timetable']);
        Setting::updateOrCreate(['key' => self::RANGE_KEYS['morningEnd']], ['value' => $ranges['morning']['end'], 'group' => 'timetable']);
        Setting::updateOrCreate(['key' => self::RANGE_KEYS['eveningStart']], ['value' => $ranges['evening']['start'], 'group' => 'timetable']);
        Setting::updateOrCreate(['key' => self::RANGE_KEYS['eveningEnd']], ['value' => $ranges['evening']['end'], 'group' => 'timetable']);

        return response()->json(['message' => 'Shift ranges saved.', 'ranges' => $ranges]);
    }

    public function getSlots(Request $request)
    {
        $q = TimeSlot::query();
        if ($request->query('shift')) $q->where('shift', $request->query('shift'));
        $slots = $q->orderBy('sort_order', 'asc')->orderBy('start_time', 'asc')->get();

        $shiftOrder = ['morning' => 0, 'evening' => 1];
        $slots = $slots->sort(function($a, $b) use ($shiftOrder) {
            if ($shiftOrder[$a->shift] !== $shiftOrder[$b->shift]) return $shiftOrder[$a->shift] - $shiftOrder[$b->shift];
            if ($a->sort_order !== $b->sort_order) return $a->sort_order - $b->sort_order;
            return strcmp($a->start_time, $b->start_time);
        })->values();

        return response()->json(['slots' => $slots, 'ranges' => $this->getShiftRanges()]);
    }

    public function storeSlot(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        $req = $request->validate([
            'name' => 'required|string',
            'startTime' => 'required|string|regex:/^([01]\d|2[0-3]):[0-5]\d$/',
            'endTime' => 'required|string|regex:/^([01]\d|2[0-3]):[0-5]\d$/',
        ], [
            'startTime.regex' => 'Start and end time must be in HH:MM format.',
            'endTime.regex' => 'Start and end time must be in HH:MM format.'
        ]);
        $shift = $request->shift ?: 'morning';

        if (!in_array($shift, ['morning', 'evening'])) return response()->json(['message' => 'Shift must be morning or evening.'], 422);
        if ($req['startTime'] >= $req['endTime']) return response()->json(['message' => 'Start time must be before end time.'], 422);

        $rangeError = $this->validateSlotInRange(['shift' => $shift, 'startTime' => $req['startTime'], 'endTime' => $req['endTime']], $this->getShiftRanges());
        if ($rangeError) return response()->json(['message' => $rangeError], 422);

        $overlapping = TimeSlot::where('shift', $shift)
            ->where('start_time', '<', $req['endTime'])
            ->where('end_time', '>', $req['startTime'])
            ->first();

        if ($overlapping) return response()->json(['message' => "Overlaps with {$overlapping->name} ({$overlapping->start_time}–{$overlapping->end_time}) in the same shift."], 422);

        $count = TimeSlot::where('shift', $shift)->count();

        try {
            $slot = TimeSlot::create([
                'name' => $req['name'],
                'start_time' => $req['startTime'],
                'end_time' => $req['endTime'],
                'shift' => $shift,
                'sort_order' => $count + 1
            ]);
            return response()->json(['slot' => $slot], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') return response()->json(['message' => 'An identical slot already exists in this shift.'], 422);
            throw $e;
        }
    }

    public function updateSlot(Request $request, $id)
    {
        Gate::authorize('timetable.manage');
        
        $req = $request->validate([
            'name' => 'required|string',
            'startTime' => 'required|string|regex:/^([01]\d|2[0-3]):[0-5]\d$/',
            'endTime' => 'required|string|regex:/^([01]\d|2[0-3]):[0-5]\d$/',
        ]);
        $shift = $request->shift ?: 'morning';

        if (!in_array($shift, ['morning', 'evening'])) return response()->json(['message' => 'Shift must be morning or evening.'], 422);
        if ($req['startTime'] >= $req['endTime']) return response()->json(['message' => 'Start time must be before end time.'], 422);

        $rangeError = $this->validateSlotInRange(['shift' => $shift, 'startTime' => $req['startTime'], 'endTime' => $req['endTime']], $this->getShiftRanges());
        if ($rangeError) return response()->json(['message' => $rangeError], 422);

        $overlapping = TimeSlot::where('id', '!=', $id)
            ->where('shift', $shift)
            ->where('start_time', '<', $req['endTime'])
            ->where('end_time', '>', $req['startTime'])
            ->first();

        if ($overlapping) return response()->json(['message' => "Overlaps with {$overlapping->name} ({$overlapping->start_time}–{$overlapping->end_time}) in the same shift."], 422);

        try {
            $slot = TimeSlot::find($id);
            $slot->update([
                'name' => $req['name'],
                'start_time' => $req['startTime'],
                'end_time' => $req['endTime'],
                'shift' => $shift
            ]);
            return response()->json(['slot' => $slot]);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') return response()->json(['message' => 'An identical slot already exists in this shift.'], 422);
            throw $e;
        }
    }

    public function generateSlots(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        $shift = $request->shift;
        $dur = (int)$request->duration;
        $brDur = (int)$request->breakDuration ?: 0;
        $breakStart = $request->breakStart;

        if (!in_array($shift, ['morning', 'evening'])) return response()->json(['message' => 'Shift must be morning or evening.'], 422);
        if ($dur < 10 || $dur > 180) return response()->json(['message' => 'Lecture duration must be a whole number between 10 and 180 minutes.'], 422);
        if ($brDur < 0 || $brDur > 120) return response()->json(['message' => 'Break duration must be between 0 and 120 minutes.'], 422);
        if ($brDur > 0 && !preg_match('/^([01]\d|2[0-3]):[0-5]\d$/', $breakStart)) return response()->json(['message' => 'Break time must be in HH:MM format.'], 422);

        $range = $this->getShiftRanges()[$shift];
        $toMin = fn($t) => (int)substr($t, 0, 2) * 60 + (int)substr($t, 3);
        $toHHMM = fn($m) => sprintf('%02d:%02d', floor($m / 60), $m % 60);

        $rangeStart = $toMin($range['start']);
        $rangeEnd = $toMin($range['end']);
        $brStart = $brDur > 0 ? $toMin($breakStart) : null;

        if ($brStart !== null && ($brStart < $rangeStart || $brStart + $brDur > $rangeEnd)) {
            return response()->json(['message' => "Break must fall inside the {$shift} range ({$range['start']}–{$range['end']})."], 422);
        }

        $periods = [];
        $cursor = $rangeStart;
        while ($cursor + $dur <= $rangeEnd) {
            if ($brStart !== null && $cursor < $brStart + $brDur && $cursor + $dur > $brStart) {
                $cursor = $brStart + $brDur;
                continue;
            }
            $periods[] = ['startTime' => $toHHMM($cursor), 'endTime' => $toHHMM($cursor + $dur), 'shift' => $shift];
            $cursor += $dur;
        }

        if (empty($periods)) return response()->json(['message' => 'No periods fit — check the shift range, duration, and break.'], 422);

        try {
            $slots = DB::transaction(function() use ($shift, $periods) {
                $existing = TimeSlot::where('shift', $shift)->orderBy('sort_order', 'asc')->get();
                $keep = min(count($existing), count($periods));
                $surplus = $existing->slice(count($periods));

                foreach ($surplus as $s) {
                    $inUse = TimetableEntry::where('time_slot_id', $s->id)->count();
                    if ($inUse > 0) {
                        $p = $inUse === 1 ? '' : 's';
                        throw new \Exception("Fewer periods would drop {$s->name}, which still has {$inUse} timetable period{$p}. Remove those in the Timetable Builder first, or keep at least " . count($existing) . " periods.", 422);
                    }
                }

                for ($i = 0; $i < count($existing); $i++) {
                    $tag = sprintf('%02d', $i);
                    $existing[$i]->update(['start_time' => "00:{$tag}", 'end_time' => "01:{$tag}"]);
                }

                for ($i = 0; $i < $keep; $i++) {
                    $existing[$i]->update([
                        'name' => "Period " . ($i + 1),
                        'start_time' => $periods[$i]['startTime'],
                        'end_time' => $periods[$i]['endTime'],
                        'sort_order' => $i + 1
                    ]);
                }

                for ($i = $keep; $i < count($periods); $i++) {
                    TimeSlot::create([
                        'name' => "Period " . ($i + 1),
                        'start_time' => $periods[$i]['startTime'],
                        'end_time' => $periods[$i]['endTime'],
                        'shift' => $shift,
                        'sort_order' => $i + 1
                    ]);
                }

                foreach ($surplus as $s) {
                    $s->delete();
                }

                return TimeSlot::where('shift', $shift)->orderBy('sort_order', 'asc')->get();
            });

            $brMsg = $brDur ? ", {$brDur} min break at {$breakStart}" : '';
            return response()->json([
                'slots' => $slots,
                'message' => count($slots) . " {$shift} periods set ({$range['start']}–{$range['end']}, {$dur} min each{$brMsg}). Existing timetable periods kept their subjects and picked up the new times."
            ], 201);
        } catch (\Exception $e) {
            if ($e->getCode() === 422) return response()->json(['message' => $e->getMessage()], 422);
            if (isset($e->errorInfo) && $e->getCode() === '23000') return response()->json(['message' => 'Two periods ended up with the same time — adjust the duration or break and try again.'], 422);
            throw $e;
        }
    }

    public function destroySlot(Request $request, $id)
    {
        Gate::authorize('timetable.manage');
        
        $used = TimetableEntry::where('time_slot_id', $id)->count();
        if ($used > 0) return response()->json(['message' => 'This time slot is used in the timetable. Remove those periods first.'], 422);
        
        TimeSlot::where('id', $id)->delete();
        return response()->json(['message' => 'Time slot removed.']);
    }

    public function destroyAllSlots(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        $used = TimetableEntry::count();
        if ($used > 0) {
            $s = $used === 1 ? ' is' : 's are';
            return response()->json(['message' => "{$used} timetable period{$s} using these slots. Clear the timetable first (Timetable Builder → Clear all)."], 422);
        }

        $count = TimeSlot::count();
        TimeSlot::query()->delete();
        $s = $count === 1 ? '' : 's';
        return response()->json(['message' => "Removed {$count} time slot{$s}."]);
    }

    private function checkConflict($day, $timeSlotId, $roomId, $teacherId, $classSectionId, $excludeId = null)
    {
        $slot = TimeSlot::find($timeSlotId);
        if (!$slot) return 'Time slot not found.';

        $q = TimetableEntry::with(['allocation.subject', 'allocation.classSection.program', 'room', 'teacher', 'timeSlot'])
            ->where('day', $day)
            ->where(function($query) use ($roomId, $teacherId, $classSectionId) {
                $query->where('room_id', $roomId)
                      ->orWhere('teacher_id', $teacherId)
                      ->orWhere('class_section_id', $classSectionId);
            });

        if ($excludeId) $q->where('id', '!=', $excludeId);

        $entries = $q->get();
        $overlaps = fn($a, $b) => $a->start_time < $b->end_time && $b->start_time < $a->end_time;

        $clashing = $entries->filter(fn($e) => $overlaps($e->timeSlot, $slot));

        $describe = fn($e) => "{$e->teacher->name} already teaches {$e->allocation->classSection->program->code} Semester {$e->allocation->classSection->term_no} ({$e->allocation->classSection->shift}) {$e->allocation->subject->title} in {$e->room->name}, " . self::DAY_LABELS[$e->day] . " {$e->timeSlot->name}";

        $teacherClash = $clashing->firstWhere('teacher_id', $teacherId);
        $roomClash = $clashing->firstWhere('room_id', $roomId);
        $sectionClash = $clashing->firstWhere('class_section_id', $classSectionId);

        if ($teacherClash) return "Teacher conflict: " . $describe($teacherClash) . ".";
        if ($roomClash) return "Room conflict: " . $describe($roomClash) . ".";
        if ($sectionClash) return "Class shift conflict: " . $describe($sectionClash) . ".";
        
        return null;
    }

    public function getEntries(Request $request)
    {
        $q = TimetableEntry::with([
            'allocation.subject', 'allocation.teacher', 'allocation.classSection.program',
            'timeSlot', 'room'
        ]);

        if ($request->query('section')) $q->where('class_section_id', (int)$request->query('section'));
        if ($request->query('teacher')) $q->where('teacher_id', (int)$request->query('teacher'));
        if ($request->query('room')) $q->where('room_id', (int)$request->query('room'));

        $entries = $q->get();
        return response()->json(['entries' => $entries]);
    }

    public function storeEntry(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        $req = $request->validate([
            'allocationId' => 'required|integer',
            'day' => 'required|string',
            'timeSlotId' => 'required|integer',
            'roomId' => 'required|integer'
        ]);

        $alloc = Allocation::with('classSection')->find($req['allocationId']);
        if (!$alloc) return response()->json(['message' => 'Allocation not found.'], 404);
        
        $slot = TimeSlot::find($req['timeSlotId']);
        if (!$slot) return response()->json(['message' => 'Time slot not found.'], 404);
        
        if ($alloc->classSection->shift !== $slot->shift) {
            return response()->json(['message' => "This is a {$alloc->classSection->shift} class. Select a {$alloc->classSection->shift} time slot."], 422);
        }

        $conflict = $this->checkConflict($req['day'], $req['timeSlotId'], $req['roomId'], $alloc->teacher_id, $alloc->class_section_id);
        if ($conflict) return response()->json(['message' => $conflict], 422);

        try {
            $entry = TimetableEntry::create([
                'allocation_id' => $alloc->id,
                'academic_session_id' => $alloc->academic_session_id,
                'day' => $req['day'],
                'time_slot_id' => $req['timeSlotId'],
                'room_id' => $req['roomId'],
                'teacher_id' => $alloc->teacher_id,
                'class_section_id' => $alloc->class_section_id
            ]);

            $entry->load([
                'allocation.subject', 'allocation.teacher', 'allocation.classSection.program',
                'timeSlot', 'room'
            ]);

            return response()->json(['entry' => $entry], 201);
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000') return response()->json(['message' => 'That day + period is already booked (database constraint).'], 422);
            throw $e;
        }
    }

    public function destroyEntry(Request $request, $id)
    {
        Gate::authorize('timetable.manage');
        
        TimetableEntry::where('id', $id)->delete();
        return response()->json(['message' => 'Entry removed.']);
    }

    public function destroyEntries(Request $request)
    {
        Gate::authorize('timetable.manage');
        
        if (!$request->query('section')) return response()->json(['message' => 'Class shift is required.'], 422);
        $count = TimetableEntry::where('class_section_id', (int)$request->query('section'))->count();
        TimetableEntry::where('class_section_id', (int)$request->query('section'))->delete();
        
        $s = $count === 1 ? '' : 's';
        return response()->json(['message' => "Cleared {$count} period{$s}."]);
    }

    public function myTeacher(Request $request)
    {
        if (!$request->user()->hasRole('teacher')) abort(403);
        $teacher = Teacher::where('user_id', $request->user()->id)->firstOrFail();
        
        $entries = TimetableEntry::with([
            'allocation.subject', 'allocation.teacher', 'allocation.classSection.program',
            'timeSlot', 'room'
        ])->where('teacher_id', $teacher->id)->get();
        
        return response()->json(['entries' => $entries]);
    }

    public function myStudent(Request $request)
    {
        if (!$request->user()->hasRole('student')) abort(403);
        $student = $request->user()->student ?? Student::where('user_id', $request->user()->id)->firstOrFail();
        
        if (!$student->class_section_id) return response()->json(['entries' => []]);
        
        $entries = TimetableEntry::with([
            'allocation.subject', 'allocation.teacher', 'allocation.classSection.program',
            'timeSlot', 'room'
        ])->where('class_section_id', $student->class_section_id)->get();
        
        return response()->json(['entries' => $entries]);
    }
}

<?php
use Illuminate\Support\Facades\DB;
use App\Models\Program;
use App\Models\Teacher;
use App\Models\ClassSection;

DB::beginTransaction();

try {
    echo "1. Generating Time Slots...\n";
    $slots = [
        ['name' => '1st Period', 'start_time' => '08:00', 'end_time' => '09:00', 'shift' => 'morning', 'sort_order' => 1],
        ['name' => '2nd Period', 'start_time' => '09:00', 'end_time' => '10:00', 'shift' => 'morning', 'sort_order' => 2],
        ['name' => '3rd Period', 'start_time' => '10:00', 'end_time' => '11:00', 'shift' => 'morning', 'sort_order' => 3],
        ['name' => '4th Period', 'start_time' => '11:00', 'end_time' => '12:00', 'shift' => 'morning', 'sort_order' => 4],
        ['name' => '5th Period', 'start_time' => '12:00', 'end_time' => '13:00', 'shift' => 'morning', 'sort_order' => 5],
        
        ['name' => '1st Period', 'start_time' => '14:00', 'end_time' => '15:00', 'shift' => 'evening', 'sort_order' => 1],
        ['name' => '2nd Period', 'start_time' => '15:00', 'end_time' => '16:00', 'shift' => 'evening', 'sort_order' => 2],
        ['name' => '3rd Period', 'start_time' => '16:00', 'end_time' => '17:00', 'shift' => 'evening', 'sort_order' => 3],
        ['name' => '4th Period', 'start_time' => '17:00', 'end_time' => '18:00', 'shift' => 'evening', 'sort_order' => 4],
        ['name' => '5th Period', 'start_time' => '18:00', 'end_time' => '19:00', 'shift' => 'evening', 'sort_order' => 5],
    ];
    
    foreach ($slots as $slot) {
        $exists = DB::table('time_slots')->where('name', $slot['name'])->where('shift', $slot['shift'])->exists();
        if (!$exists) {
            DB::table('time_slots')->insert($slot);
        }
    }

    echo "2. Generating Rooms...\n";
    for ($i = 1; $i <= 50; $i++) {
        $name = "Room " . str_pad($i, 3, '0', STR_PAD_LEFT);
        if (!DB::table('rooms')->where('name', $name)->exists()) {
            DB::table('rooms')->insert([
                'name' => $name,
                'type' => 'classroom',
                'capacity' => rand(30, 80),
                'is_active' => 1
            ]);
        }
    }
    for ($i = 1; $i <= 10; $i++) {
        $name = "Lab " . str_pad($i, 2, '0', STR_PAD_LEFT);
        if (!DB::table('rooms')->where('name', $name)->exists()) {
            DB::table('rooms')->insert([
                'name' => $name,
                'type' => 'lab',
                'capacity' => rand(20, 40),
                'is_active' => 1
            ]);
        }
    }

    echo "3. Generating Subjects...\n";
    $programs = DB::table('programs')->get();
    $subjectIds = [];
    foreach ($programs as $prog) {
        // BS programs generally have 8 terms. Inter 2 (1st year, 2nd year). Diploma usually 2.
        $terms = str_contains($prog->name, 'BS') ? 8 : 2;
        
        for ($term = 1; $term <= $terms; $term++) {
            for ($s = 1; $s <= 5; $s++) {
                $code = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $prog->code ?? $prog->name), 0, 3)) . '-' . $term . '0' . $s;
                $title = "{$prog->name} Term {$term} Subject {$s}";
                
                $sub = DB::table('subjects')->where('program_id', $prog->id)->where('code', $code)->first();
                if (!$sub) {
                    $subId = DB::table('subjects')->insertGetId([
                        'program_id' => $prog->id,
                        'term_no' => $term,
                        'title' => $title,
                        'code' => $code,
                        'credit_hours' => 3,
                        'is_active' => 1
                    ]);
                    $subjectIds[] = $subId;
                } else {
                    $subjectIds[] = $sub->id;
                }
            }
        }
    }

    echo "4. Allocating Subjects to Teachers...\n";
    $sections = DB::table('class_sections')->get();
    $teachers = DB::table('teachers')->where('status', 'active')->pluck('id')->toArray();
    
    if (count($teachers) > 0) {
        $allocsCount = 0;
        foreach ($sections as $section) {
            $subs = DB::table('subjects')->where('program_id', $section->program_id)->where('term_no', $section->term_no)->get();
            foreach ($subs as $sub) {
                $exists = DB::table('allocations')->where('class_section_id', $section->id)->where('subject_id', $sub->id)->exists();
                if (!$exists) {
                    DB::table('allocations')->insert([
                        'class_section_id' => $section->id,
                        'subject_id' => $sub->id,
                        'teacher_id' => $teachers[array_rand($teachers)],
                        'academic_session_id' => $section->academic_session_id,
                        'is_active' => 1
                    ]);
                    $allocsCount++;
                }
            }
        }
        echo "   Allocated $allocsCount subjects.\n";
    } else {
        echo "   No active teachers found. Skipping allocations.\n";
    }

    DB::commit();
    echo "Timetable seeding completed successfully.\n";

} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}

<?php

use Illuminate\Http\Request;
use App\Http\Controllers\TimetableController;
use App\Models\Allocation;
use App\Models\TimeSlot;
use App\Models\Room;
use App\Models\TimetableEntry;

use Illuminate\Support\Facades\DB;

$controller = new TimetableController();

echo "Running Timetable Clash Smoke Tests...\n\n";

// Clear previous entries for a clean test
TimetableEntry::truncate();
echo "Cleared existing timetable entries.\n\n";

// Get some test data
$alloc1 = DB::table('allocations')->first();
$alloc2 = DB::table('allocations')->where('id', '!=', $alloc1->id)
            ->where('teacher_id', '!=', $alloc1->teacher_id)
            ->where('class_section_id', '!=', $alloc1->class_section_id)
            ->first();

$section1 = DB::table('class_sections')->where('id', $alloc1->class_section_id)->first();
$shift = $section1->name === 'evening' ? 'evening' : 'morning';

$slot1 = DB::table('time_slots')->where('shift', $shift)->first();
$room1 = DB::table('rooms')->first();
$room2 = DB::table('rooms')->where('id', '!=', $room1->id)->first();

if (!$alloc1 || !$alloc2 || !$slot1 || !$room1 || !$room2) {
    echo "Test failed: Not enough data in database to perform smoke tests.\n";
    exit;
}

echo "--- TEST 1: Create a valid timetable entry ---\n";
$req1 = Request::create('/api/timetable/entries', 'POST', [
    'allocationId' => $alloc1->id,
    'day' => 'mon',
    'timeSlotId' => $slot1->id,
    'roomId' => $room1->id
]);
// We have to mock Gate::authorize since we are running in tinker without an auth context
\Illuminate\Support\Facades\Gate::shouldReceive('authorize')->andReturn(true);

$res1 = $controller->storeEntry($req1);
if ($res1->status() == 201) {
    echo "✅ PASS: Valid entry created successfully.\n";
} else {
    echo "❌ FAIL: Could not create valid entry. " . json_encode($res1->getData()) . "\n";
}

echo "\n--- TEST 2: Teacher Clash ---\n";
// Try to schedule the exact same allocation (same teacher) at the same time in a different room
$req2 = Request::create('/api/timetable/entries', 'POST', [
    'allocationId' => $alloc1->id,
    'day' => 'mon',
    'timeSlotId' => $slot1->id,
    'roomId' => $room2->id
]);
$res2 = $controller->storeEntry($req2);
if ($res2->status() == 422 && str_contains($res2->getData()->message, 'conflict')) {
    echo "✅ PASS: Teacher clash accurately detected! Error: " . $res2->getData()->message . "\n";
} else {
    echo "❌ FAIL: Teacher clash was not caught or returned wrong error. Status: " . $res2->status() . "\n";
}

echo "\n--- TEST 3: Room Clash ---\n";
// Try to schedule a completely different allocation (different teacher, different class) in the SAME room at the SAME time
$req3 = Request::create('/api/timetable/entries', 'POST', [
    'allocationId' => $alloc2->id,
    'day' => 'mon',
    'timeSlotId' => $slot1->id, // Same time
    'roomId' => $room1->id // Same room!
]);
$res3 = $controller->storeEntry($req3);
if ($res3->status() == 422 && str_contains($res3->getData()->message, 'Room conflict')) {
    echo "✅ PASS: Room clash accurately detected! Error: " . $res3->getData()->message . "\n";
} else {
    echo "❌ FAIL: Room clash was not caught. Status: " . $res3->status() . "\n";
}

echo "\n--- TEST 4: Class Section Clash ---\n";
// Find another allocation for the same class section but different teacher
$allocSameSection = Allocation::where('class_section_id', $alloc1->class_section_id)
                      ->where('id', '!=', $alloc1->id)
                      ->where('teacher_id', '!=', $alloc1->teacher_id)
                      ->first();

if ($allocSameSection) {
    $req4 = Request::create('/api/timetable/entries', 'POST', [
        'allocationId' => $allocSameSection->id,
        'day' => 'mon',
        'timeSlotId' => $slot1->id, // Same time
        'roomId' => $room2->id // Different room, different teacher, but same students!
    ]);
    $res4 = $controller->storeEntry($req4);
    if ($res4->status() == 422 && str_contains($res4->getData()->message, 'Class shift conflict')) {
        echo "✅ PASS: Class Section clash accurately detected! Error: " . $res4->getData()->message . "\n";
    } else {
        echo "❌ FAIL: Class Section clash was not caught. Status: " . $res4->status() . " Msg: " . json_encode($res4->getData()) . "\n";
    }
} else {
    echo "⚠️ SKIP: Not enough data to test Class Section clash.\n";
}

echo "\nSmoke tests completed.\n";

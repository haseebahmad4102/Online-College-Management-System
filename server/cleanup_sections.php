<?php
use App\Models\ClassSection;
use Illuminate\Support\Facades\DB;

$sections = ClassSection::orderBy('id', 'asc')->get();
$seen = [];

DB::beginTransaction();
try {
    foreach ($sections as $s) {
        $key = "{$s->program_id}_{$s->academic_session_id}_{$s->term_no}_{$s->shift}_{$s->name}";
        if (isset($seen[$key])) {
            $keepId = $seen[$key];
            $deleteId = $s->id;
            
            // Re-assign related records to the kept ID
            DB::table('students')->where('class_section_id', $deleteId)->update(['class_section_id' => $keepId]);
            DB::table('allocations')->where('class_section_id', $deleteId)->update(['class_section_id' => $keepId]);
            DB::table('timetable_entries')->where('class_section_id', $deleteId)->update(['class_section_id' => $keepId]);
            DB::table('exam_allocations')->where('class_section_id', $deleteId)->update(['class_section_id' => $keepId]);
            
            // Delete the duplicate
            $s->delete();
            echo "Deleted duplicate section ID: $deleteId (Kept: $keepId)\n";
        } else {
            $seen[$key] = $s->id;
        }
    }
    DB::commit();
    echo "Cleanup complete!\n";
} catch (\Exception $e) {
    DB::rollBack();
    echo "Error: " . $e->getMessage() . "\n";
}

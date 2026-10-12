<?php

use App\Models\Program;
use App\Models\AcademicSession;
use App\Models\ClassSection;

$programs = Program::with('level')->get();
$sessions = AcademicSession::all();

$count = 0;
foreach ($sessions as $session) {
    foreach ($programs as $program) {
        $levelName = strtolower($program->level->name ?? '');
        $isBS = str_contains($levelName, 'bs') || str_contains($levelName, 'undergraduate');
        
        $shifts = $isBS ? ['morning', 'evening'] : ['morning'];
        $maxTerms = ($program->duration_years ?: 1) * ($program->exam_system === 'annual' ? 1 : 2);
        
        for ($term = 1; $term <= $maxTerms; $term++) {
            foreach ($shifts as $shift) {
                $sectionName = $shift === 'morning' ? 'M' : 'E';
                
                $exists = ClassSection::where('program_id', $program->id)
                    ->where('academic_session_id', $session->id)
                    ->where('term_no', $term)
                    ->where('shift', $shift)
                    ->exists();
                
                if (!$exists) {
                    ClassSection::create([
                        'program_id' => $program->id,
                        'academic_session_id' => $session->id,
                        'term_no' => $term,
                        'name' => $sectionName,
                        'shift' => $shift,
                        'capacity' => 50,
                        'is_active' => true
                    ]);
                    $count++;
                }
            }
        }
    }
}

echo "Generated $count new class sections.\n";

<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // Fix program level names to be clean (without "(e.g. DIT)" etc.)
        \DB::table('program_levels')->where('code', 'intermediate')->update(['name' => 'Intermediate']);
        \DB::table('program_levels')->where('code', 'diploma')->update(['name' => 'Diploma']);
        \DB::table('program_levels')->where('code', 'bs')->update(['name' => 'BS / Undergraduate']);

        // Fix DIT program: ensure it is linked to the Diploma level, not Intermediate
        $diplomaLevelId = \DB::table('program_levels')->where('code', 'diploma')->value('id');
        if ($diplomaLevelId) {
            \DB::table('programs')->where('code', 'DIT')->update(['program_level_id' => $diplomaLevelId]);
        }

        // Fix admission cycle titles: strip verbose level names from titles
        \DB::table('admission_cycles')
            ->where('title', 'LIKE', 'Diploma (e.g. DIT) Admissions%')
            ->update(['title' => \DB::raw("REPLACE(title, 'Diploma (e.g. DIT)', 'Diploma')")]);

        \DB::table('admission_cycles')
            ->where('title', 'LIKE', 'Intermediate (FA/FSc/ICS) Admissions%')
            ->update(['title' => \DB::raw("REPLACE(title, 'Intermediate (FA/FSc/ICS)', 'Intermediate')")]);
    }

    public function down(): void
    {
        // Non-destructive — no rollback needed
    }
};

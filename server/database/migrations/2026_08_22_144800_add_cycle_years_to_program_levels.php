<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('program_levels', function (Blueprint $table) {
            // How many years a session/cycle for this level runs.
            // Separate from exam_system because DIT is semester-based but only 2 years.
            $table->tinyInteger('cycle_years')->default(4)->after('default_exam_system');
        });

        // Patch existing rows: BS=4, Intermediate=2, Diploma=2
        \DB::table('program_levels')->where('code', 'bs')->update(['cycle_years' => 4]);
        \DB::table('program_levels')->where('code', 'intermediate')->update(['cycle_years' => 2]);
        \DB::table('program_levels')->where('code', 'diploma')->update(['cycle_years' => 2]);
    }

    public function down(): void
    {
        Schema::table('program_levels', function (Blueprint $table) {
            $table->dropColumn('cycle_years');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create program_levels table
        Schema::create('program_levels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->enum('merit_rule', ['matric_only', 'inter_only', 'weighted_matric_inter'])->default('matric_only');
            $table->enum('prerequisite_type', ['matric_groups', 'inter_groups', 'none'])->default('none');
            $table->enum('default_exam_system', ['annual', 'semester'])->default('semester');
            $table->integer('min_age')->default(15);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Insert default levels to map existing data
        \DB::table('program_levels')->insert([
            [
                'name' => 'BS / Undergraduate',
                'code' => 'bs',
                'merit_rule' => 'weighted_matric_inter',
                'prerequisite_type' => 'inter_groups',
                'default_exam_system' => 'semester',
                'min_age' => 16,
            ],
            [
                'name' => 'Intermediate (FA/FSc/ICS)',
                'code' => 'intermediate',
                'merit_rule' => 'matric_only',
                'prerequisite_type' => 'matric_groups',
                'default_exam_system' => 'annual',
                'min_age' => 15,
            ],
            [
                'name' => 'Diploma (e.g. DIT)',
                'code' => 'diploma',
                'merit_rule' => 'matric_only',
                'prerequisite_type' => 'matric_groups',
                'default_exam_system' => 'semester',
                'min_age' => 15,
            ]
        ]);

        // 3. Add program_level_id to programs and admission_cycles
        Schema::table('programs', function (Blueprint $table) {
            $table->foreignId('program_level_id')->nullable()->constrained('program_levels')->onDelete('restrict');
        });
        Schema::table('admission_cycles', function (Blueprint $table) {
            $table->foreignId('program_level_id')->nullable()->constrained('program_levels')->onDelete('restrict');
        });

        // 4. Map existing data in programs and admission_cycles
        \DB::statement("UPDATE programs p JOIN program_levels pl ON p.level = pl.code SET p.program_level_id = pl.id");
        \DB::statement("UPDATE admission_cycles a JOIN program_levels pl ON a.level = pl.code SET a.program_level_id = pl.id");

        // 5. Drop old level columns and make new ones NOT NULL
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn('level');
        });
        \DB::statement("ALTER TABLE programs MODIFY COLUMN program_level_id bigint unsigned NOT NULL");

        Schema::table('admission_cycles', function (Blueprint $table) {
            $table->dropColumn('level');
        });
        \DB::statement("ALTER TABLE admission_cycles MODIFY COLUMN program_level_id bigint unsigned NOT NULL");

        // 6. Create document type pivot table
        Schema::create('document_type_program_level', function (Blueprint $table) {
            $table->integer('document_type_id');
            $table->foreignId('program_level_id')->constrained('program_levels')->onDelete('cascade');
            $table->primary(['document_type_id', 'program_level_id'], 'dt_pl_primary');
            $table->foreign('document_type_id')->references('id')->on('document_types')->onDelete('cascade');
        });

        // 7. Map existing document_types data
        // If applies_to = 'both', map to both 'bs' and 'intermediate'
        // If 'bs', map to 'bs'. If 'intermediate', map to 'intermediate'.
        $docs = \DB::table('document_types')->get();
        $bsId = \DB::table('program_levels')->where('code', 'bs')->value('id');
        $interId = \DB::table('program_levels')->where('code', 'intermediate')->value('id');
        $diplomaId = \DB::table('program_levels')->where('code', 'diploma')->value('id');

        foreach ($docs as $doc) {
            $toInsert = [];
            if ($doc->applies_to === 'bs' || $doc->applies_to === 'both') {
                $toInsert[] = ['document_type_id' => $doc->id, 'program_level_id' => $bsId];
            }
            if ($doc->applies_to === 'intermediate' || $doc->applies_to === 'both') {
                $toInsert[] = ['document_type_id' => $doc->id, 'program_level_id' => $interId];
                $toInsert[] = ['document_type_id' => $doc->id, 'program_level_id' => $diplomaId];
            }
            \DB::table('document_type_program_level')->insert($toInsert);
        }

        // 8. Drop applies_to from document_types
        Schema::table('document_types', function (Blueprint $table) {
            $table->dropColumn('applies_to');
        });
    }

    public function down(): void
    {
        // Down migration logic omitted for brevity due to irreversible data loss (dropping columns)
        // In a real environment, we'd add the enums back and map the data backwards.
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add expires_at to user_has_permissions
        if (!Schema::hasColumn('user_has_permissions', 'expires_at')) {
            Schema::table('user_has_permissions', function (Blueprint $table) {
                $table->dateTime('expires_at')->nullable();
            });
        }

        // 2. Add exam_system to programs
        if (!Schema::hasColumn('programs', 'exam_system')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->enum('exam_system', ['semester', 'annual'])->default('semester');
            });
            // Optional: update intermediate
            DB::statement("UPDATE programs SET exam_system = 'annual' WHERE level = 'intermediate'");
        }

        // 3. Update assessments type ENUM using raw statement because doctrine/dbal might not be installed
        DB::statement("ALTER TABLE assessments MODIFY COLUMN type ENUM('midterm','sessional','other','final','practical') NOT NULL");
    }

    public function down(): void
    {
        if (Schema::hasColumn('user_has_permissions', 'expires_at')) {
            Schema::table('user_has_permissions', function (Blueprint $table) {
                $table->dropColumn('expires_at');
            });
        }
        if (Schema::hasColumn('programs', 'exam_system')) {
            Schema::table('programs', function (Blueprint $table) {
                $table->dropColumn('exam_system');
            });
        }
        DB::statement("ALTER TABLE assessments MODIFY COLUMN type ENUM('midterm','sessional','other') NOT NULL");
    }
};

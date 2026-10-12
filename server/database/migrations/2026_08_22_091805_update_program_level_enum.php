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
        \DB::statement("ALTER TABLE programs MODIFY COLUMN level ENUM('intermediate', 'bs', 'diploma') COLLATE utf8mb4_unicode_ci NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe down migration: if we have any 'diploma' programs, it might fail.
        \DB::statement("ALTER TABLE programs MODIFY COLUMN level ENUM('intermediate', 'bs') COLLATE utf8mb4_unicode_ci NOT NULL");
    }
};

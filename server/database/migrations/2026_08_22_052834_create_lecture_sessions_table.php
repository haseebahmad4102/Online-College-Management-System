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
        Schema::create('lecture_sessions', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('lecture_id');
            $table->bigInteger('student_id');
            $table->integer('session_number');
            $table->integer('watched_sec')->default(0);
            $table->integer('furthest_sec')->default(0);
            $table->timestamps();
            
            $table->foreign('lecture_id')->references('id')->on('lectures')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lecture_sessions');
    }
};

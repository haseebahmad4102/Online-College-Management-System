<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->integer('class_section_id');
            $table->integer('room_id');
            $table->integer('start_serial');
            $table->integer('end_serial');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exam_allocations');
    }
};

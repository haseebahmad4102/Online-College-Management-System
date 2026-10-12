<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('question_papers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exam_id')->constrained('exams')->onDelete('cascade');
            $table->integer('subject_id'); // Foreign key to subjects
            $table->bigInteger('teacher_id'); // Foreign key to teachers
            $table->enum('status', ['draft', 'submitted', 'printed'])->default('draft');
            $table->text('instructions')->nullable();
            $table->integer('time_allowed_minutes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('question_papers');
    }
};

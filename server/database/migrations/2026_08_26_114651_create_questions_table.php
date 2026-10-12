<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('questions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('question_paper_id')->constrained('question_papers')->onDelete('cascade');
            $table->enum('type', ['mcq', 'short', 'long']);
            $table->text('question_text');
            $table->decimal('marks', 5, 2);
            $table->json('options')->nullable(); // For MCQs: {"A": "Opt1", "B": "Opt2", "correct": "A"}
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('questions');
    }
};

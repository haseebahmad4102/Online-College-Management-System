<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'term', 'start_date', 'end_date', 'is_active'];

    public function questionPapers()
    {
        return $this->hasMany(QuestionPaper::class);
    }

    public function papers()
    {
        return $this->hasMany(QuestionPaper::class);
    }

    public function allocations()
    {
        return $this->hasMany(ExamAllocation::class);
    }
}

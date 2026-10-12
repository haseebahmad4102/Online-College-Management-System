<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_paper_id', 'type', 'question_text', 'marks', 'options', 'sort_order'
    ];

    protected $casts = [
        'options' => 'array',
    ];

    public function questionPaper()
    {
        return $this->belongsTo(QuestionPaper::class);
    }
}

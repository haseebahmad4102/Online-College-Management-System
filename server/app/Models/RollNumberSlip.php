<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RollNumberSlip extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'student_id', 'generated_at'
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}

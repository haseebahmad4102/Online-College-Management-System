<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ExamAllocation extends Model
{
    use HasFactory;

    protected $fillable = [
        'exam_id', 'class_section_id', 'room_id', 'start_serial', 'end_serial'
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class);
    }

    public function classSection()
    {
        return $this->belongsTo(ClassSection::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}

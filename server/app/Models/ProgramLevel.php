<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProgramLevel extends Model
{
    protected $fillable = [
        'name',
        'code',
        'merit_rule',
        'prerequisite_type',
        'default_exam_system',
        'cycle_years',
        'min_age',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'min_age' => 'integer',
        'cycle_years' => 'integer',
    ];

    public function programs()
    {
        return $this->hasMany(Program::class);
    }

    public function admissionCycles()
    {
        return $this->hasMany(AdmissionCycle::class);
    }

    public function documentTypes()
    {
        return $this->belongsToMany(DocumentType::class);
    }
}

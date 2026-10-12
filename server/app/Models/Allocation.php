<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Allocation
 * 
 * @property int $id
 * @property int $class_section_id
 * @property int $subject_id
 * @property int $teacher_id
 * @property int $academic_session_id
 * @property bool $is_active
 * 
 * @property AcademicSession $academic_session
 * @property ClassSection $class_section
 * @property Subject $subject
 * @property Teacher $teacher
 * @property Collection|Assessment[] $assessments
 * @property Collection|AttendanceSheet[] $attendance_sheets
 * @property Collection|Classwork[] $classworks
 * @property Collection|Lecture[] $lectures
 * @property Collection|TimetableEntry[] $timetable_entries
 *
 * @package App\Models
 */
class Allocation extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'allocations';
	public $timestamps = false;

	protected $casts = [
		'class_section_id' => 'int',
		'subject_id' => 'int',
		'teacher_id' => 'int',
		'academic_session_id' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'class_section_id',
		'subject_id',
		'teacher_id',
		'academic_session_id',
		'is_active'
	];

	public function academic_session()
	{
		return $this->belongsTo(AcademicSession::class);
	}

	public function class_section()
	{
		return $this->belongsTo(ClassSection::class);
	}

	public function subject()
	{
		return $this->belongsTo(Subject::class);
	}

	public function teacher()
	{
		return $this->belongsTo(Teacher::class);
	}

	public function assessments()
	{
		return $this->hasMany(Assessment::class);
	}

	public function attendance_sheets()
	{
		return $this->hasMany(AttendanceSheet::class);
	}

	public function classworks()
	{
		return $this->hasMany(Classwork::class);
	}

	public function lectures()
	{
		return $this->hasMany(Lecture::class);
	}

	public function timetable_entries()
	{
		return $this->hasMany(TimetableEntry::class);
	}

	public function students()
	{
		return $this->hasMany(Student::class, 'class_section_id', 'class_section_id');
	}
}

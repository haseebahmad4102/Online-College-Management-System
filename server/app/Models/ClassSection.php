<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ClassSection
 * 
 * @property int $id
 * @property int $program_id
 * @property int $academic_session_id
 * @property int $term_no
 * @property string $name
 * @property string $shift
 * @property int|null $capacity
 * @property bool $is_active
 * 
 * @property AcademicSession $academic_session
 * @property Program $program
 * @property Collection|Allocation[] $allocations
 * @property Collection|Student[] $students
 * @property Collection|TimetableEntry[] $timetable_entries
 *
 * @package App\Models
 */
class ClassSection extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'class_sections';
	public $timestamps = false;

	protected $casts = [
		'program_id' => 'int',
		'academic_session_id' => 'int',
		'term_no' => 'int',
		'capacity' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'program_id',
		'academic_session_id',
		'term_no',
		'name',
		'shift',
		'capacity',
		'is_active'
	];

	public function academic_session()
	{
		return $this->belongsTo(AcademicSession::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}

	public function allocations()
	{
		return $this->hasMany(Allocation::class);
	}

	public function students()
	{
		return $this->hasMany(Student::class);
	}

	public function timetable_entries()
	{
		return $this->hasMany(TimetableEntry::class);
	}
}

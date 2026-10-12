<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AcademicSession
 * 
 * @property int $id
 * @property string $name
 * @property Carbon $start_year
 * @property Carbon $end_year
 * @property string $shift
 * @property bool $is_current
 * 
 * @property Collection|AdmissionCycle[] $admission_cycles
 * @property Collection|Allocation[] $allocations
 * @property Collection|ClassSection[] $class_sections
 * @property Collection|Student[] $students
 * @property Collection|TimetableEntry[] $timetable_entries
 *
 * @package App\Models
 */
class AcademicSession extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'academic_sessions';
	public $timestamps = false;

	protected $casts = [
		'start_year' => 'integer',
		'end_year' => 'integer',
		'is_current' => 'bool'
	];

	protected $fillable = [
		'name',
		'start_year',
		'end_year',
		'shift',
		'is_current'
	];

	public function admission_cycles()
	{
		return $this->hasMany(AdmissionCycle::class);
	}

	public function allocations()
	{
		return $this->hasMany(Allocation::class);
	}

	public function class_sections()
	{
		return $this->hasMany(ClassSection::class);
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

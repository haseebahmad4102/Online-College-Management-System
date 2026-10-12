<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Program
 * 
 * @property int $id
 * @property int|null $department_id
 * @property int|null $inter_group_id
 * @property int|null $program_level_id
 * @property string $name
 * @property string $code
 * @property int $duration_years
 * @property int|null $total_semesters
 * @property int $seats
 * @property float $min_percentage
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Department|null $department
 * @property InterGroup|null $inter_group
 * @property Collection|Application[] $applications
 * @property Collection|ClassSection[] $class_sections
 * @property Collection|MeritList[] $merit_lists
 * @property Collection|Notice[] $notices
 * @property Collection|ProgramEligibility[] $program_eligibilities
 * @property Collection|ProgramFeeItem[] $program_fee_items
 * @property Collection|Student[] $students
 * @property Collection|Subject[] $subjects
 *
 * @package App\Models
 */
class Program extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'programs';

	protected $casts = [
		'department_id' => 'int',
		'inter_group_id' => 'int',
		'duration_years' => 'int',
		'total_semesters' => 'int',
		'seats' => 'int',
		'min_percentage' => 'float',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'department_id',
		'inter_group_id',
		'program_level_id',
		'name',
		'code',
		'duration_years',
		'total_semesters',
		'seats',
		'min_percentage',
		'is_active'
	];

	public function level()
	{
		return $this->belongsTo(ProgramLevel::class, 'program_level_id');
	}

	public function department()
	{
		return $this->belongsTo(Department::class);
	}

	public function inter_group()
	{
		return $this->belongsTo(InterGroup::class);
	}

	public function applications()
	{
		return $this->hasMany(Application::class);
	}

	public function class_sections()
	{
		return $this->hasMany(ClassSection::class);
	}

	public function merit_lists()
	{
		return $this->hasMany(MeritList::class);
	}

	public function notices()
	{
		return $this->hasMany(Notice::class);
	}

	public function program_eligibilities()
	{
		return $this->hasMany(ProgramEligibility::class);
	}

	public function program_fee_items()
	{
		return $this->hasMany(ProgramFeeItem::class);
	}

	public function students()
	{
		return $this->hasMany(Student::class);
	}

	public function subjects()
	{
		return $this->hasMany(Subject::class);
	}
}

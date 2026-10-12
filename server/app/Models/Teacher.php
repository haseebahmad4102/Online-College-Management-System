<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Teacher
 * 
 * @property int $id
 * @property int $user_id
 * @property string $name
 * @property string|null $father_name
 * @property string $cnic
 * @property string $gender
 * @property Carbon|null $dob
 * @property string $phone
 * @property string|null $email
 * @property int $department_id
 * @property int $designation_id
 * @property string $teacher_type
 * @property string|null $qualification
 * @property string|null $specialization
 * @property string|null $education
 * @property string|null $experience
 * @property Carbon|null $joining_date
 * @property string|null $photo_path
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Department|null $department
 * @property Designation $designation
 * @property User $user
 * @property Collection|Allocation[] $allocations
 * @property Collection|CommitteeMember[] $committee_members
 * @property Collection|TimetableEntry[] $timetable_entries
 *
 * @package App\Models
 */
class Teacher extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'teachers';

	protected $casts = [
		'user_id' => 'int',
		'dob' => 'datetime',
		'department_id' => 'int',
		'designation_id' => 'int',
		'joining_date' => 'datetime'
	];

	protected $fillable = [
		'user_id',
		'name',
		'father_name',
		'cnic',
		'gender',
		'dob',
		'phone',
		'email',
		'department_id',
		'designation_id',
		'teacher_type',
		'qualification',
		'specialization',
		'education',
		'experience',
		'joining_date',
		'photo_path',
		'status'
	];

	public function department()
	{
		return $this->belongsTo(Department::class, 'department_id');
	}

	public function hod_department()
	{
		return $this->hasOne(Department::class, 'hod_teacher_id');
	}

	public function designation()
	{
		return $this->belongsTo(Designation::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function allocations()
	{
		return $this->hasMany(Allocation::class);
	}

	public function committee_members()
	{
		return $this->hasMany(CommitteeMember::class);
	}

	public function timetable_entries()
	{
		return $this->hasMany(TimetableEntry::class);
	}
}

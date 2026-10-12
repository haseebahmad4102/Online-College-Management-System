<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Student
 * 
 * @property int $id
 * @property int $user_id
 * @property int|null $application_id
 * @property string $roll_number
 * @property string|null $registration_no
 * @property int $program_id
 * @property int|null $class_section_id
 * @property int $academic_session_id
 * @property string $name
 * @property string $father_name
 * @property string $cnic_bform
 * @property string $gender
 * @property Carbon $dob
 * @property string|null $phone
 * @property string|null $guardian_phone
 * @property string|null $address
 * @property string|null $photo_path
 * @property string $matric_board
 * @property Carbon $matric_year
 * @property int $matric_obtained
 * @property int $matric_total
 * @property int|null $inter_group_id
 * @property string|null $inter_board
 * @property Carbon|null $inter_year
 * @property int|null $inter_obtained
 * @property int|null $inter_total
 * @property string $status
 * @property Carbon $admitted_on
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property AcademicSession $academic_session
 * @property Application|null $application
 * @property ClassSection|null $class_section
 * @property InterGroup|null $inter_group
 * @property Program $program
 * @property User $user
 * @property Collection|AssessmentMark[] $assessment_marks
 * @property Collection|AttendanceRecord[] $attendance_records
 * @property Collection|BookIssue[] $book_issues
 * @property Collection|BookRequest[] $book_requests
 * @property Collection|Challan[] $challans
 * @property Collection|ClassworkSubmission[] $classwork_submissions
 * @property Collection|Committee[] $committees
 * @property Collection|LectureProgress[] $lecture_progresses
 * @property Collection|StudentCarryForward[] $student_carry_forwards
 *
 * @package App\Models
 */
class Student extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'students';

	protected $casts = [
		'user_id' => 'int',
		'application_id' => 'int',
		'program_id' => 'int',
		'class_section_id' => 'int',
		'academic_session_id' => 'int',
		'dob' => 'datetime',
		'matric_year' => 'int',
		'matric_obtained' => 'int',
		'matric_total' => 'int',
		'matric_group_id' => 'int',
		'inter_group_id' => 'int',
		'inter_year' => 'int',
		'inter_obtained' => 'int',
		'inter_total' => 'int',
		'admitted_on' => 'datetime'
	];

	protected $fillable = [
		'user_id',
		'application_id',
		'roll_number',
		'registration_no',
		'program_id',
		'class_section_id',
		'academic_session_id',
		'name',
		'father_name',
		'cnic_bform',
		'gender',
		'dob',
		'phone',
		'guardian_phone',
		'address',
		'photo_path',
		'matric_board',
		'matric_year',
		'matric_obtained',
		'matric_total',
		'matric_group_id',
		'inter_group_id',
		'inter_board',
		'inter_year',
		'inter_obtained',
		'inter_total',
		'status',
		'admitted_on'
	];

	public function academic_session()
	{
		return $this->belongsTo(AcademicSession::class);
	}

	public function application()
	{
		return $this->belongsTo(Application::class);
	}

	public function class_section()
	{
		return $this->belongsTo(ClassSection::class);
	}

	public function inter_group()
	{
		return $this->belongsTo(InterGroup::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class);
	}

	public function assessment_marks()
	{
		return $this->hasMany(AssessmentMark::class);
	}

	public function attendance_records()
	{
		return $this->hasMany(AttendanceRecord::class);
	}

	public function book_issues()
	{
		return $this->hasMany(BookIssue::class);
	}

	public function book_requests()
	{
		return $this->hasMany(BookRequest::class);
	}

	public function challans()
	{
		return $this->hasMany(Challan::class);
	}

	public function classwork_submissions()
	{
		return $this->hasMany(ClassworkSubmission::class);
	}

	public function committees()
	{
		return $this->belongsToMany(Committee::class, 'committee_student_members')
					->withPivot('position');
	}

	public function lecture_progresses()
	{
		return $this->hasMany(LectureProgress::class);
	}

	public function student_carry_forwards()
	{
		return $this->hasMany(StudentCarryForward::class);
	}
}

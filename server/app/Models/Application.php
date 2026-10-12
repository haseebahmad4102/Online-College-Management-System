<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Application
 * 
 * @property int $id
 * @property string $application_no
 * @property int $user_id
 * @property int $admission_cycle_id
 * @property int $program_id
 * @property string $name
 * @property string $father_name
 * @property string $cnic_bform
 * @property string $gender
 * @property Carbon $dob
 * @property string|null $province
 * @property string $domicile_district
 * @property string $address
 * @property string $phone
 * @property string|null $guardian_phone
 * @property string|null $photo_path
 * @property string|null $religion
 * @property string|null $marital_status
 * @property string|null $blood_group
 * @property bool $has_disability
 * @property string|null $disability_details
 * @property string|null $medical_conditions
 * @property bool $is_hafiz
 * @property string $matric_board
 * @property Carbon $matric_year
 * @property string $matric_roll_no
 * @property int $matric_obtained
 * @property int $matric_total
 * @property int|null $inter_group_id
 * @property string|null $inter_board
 * @property Carbon|null $inter_year
 * @property string|null $inter_roll_no
 * @property int|null $inter_obtained
 * @property int|null $inter_total
 * @property float|null $merit_score
 * @property bool $eligibility_override
 * @property string|null $override_reason
 * @property string $status
 * @property string|null $remarks
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property AdmissionCycle $admission_cycle
 * @property InterGroup|null $inter_group
 * @property Program $program
 * @property User $user
 * @property Collection|ApplicationDocument[] $application_documents
 * @property Collection|Challan[] $challans
 * @property Collection|MeritListEntry[] $merit_list_entries
 * @property Student|null $student
 *
 * @package App\Models
 */
class Application extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'applications';

	protected $casts = [
		'user_id' => 'int',
		'admission_cycle_id' => 'int',
		'program_id' => 'int',
		'dob' => 'datetime',
		'has_disability' => 'bool',
		'is_hafiz' => 'bool',
		'matric_year' => 'int',
		'matric_obtained' => 'int',
		'matric_total' => 'int',
		'matric_group_id' => 'int',
		'inter_group_id' => 'int',
		'inter_year' => 'int',
		'inter_obtained' => 'int',
		'inter_total' => 'int',
		'merit_score' => 'float',
		'eligibility_override' => 'bool',
		'verified_by' => 'int',
		'verified_at' => 'datetime'
	];

	protected $fillable = [
		'application_no',
		'user_id',
		'admission_cycle_id',
		'program_id',
		'name',
		'father_name',
		'cnic_bform',
		'gender',
		'dob',
		'province',
		'domicile_district',
		'address',
		'phone',
		'guardian_phone',
		'photo_path',
		'religion',
		'marital_status',
		'blood_group',
		'has_disability',
		'disability_details',
		'medical_conditions',
		'is_hafiz',
		'matric_board',
		'matric_year',
		'matric_roll_no',
		'matric_obtained',
		'matric_total',
		'matric_group_id',
		'inter_group_id',
		'inter_board',
		'inter_year',
		'inter_roll_no',
		'inter_obtained',
		'inter_total',
		'merit_score',
		'eligibility_override',
		'override_reason',
		'status',
		'remarks',
		'verified_by',
		'verified_at'
	];

	public function admission_cycle()
	{
		return $this->belongsTo(AdmissionCycle::class);
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

	public function application_documents()
	{
		return $this->hasMany(ApplicationDocument::class);
	}

	public function challans()
	{
		return $this->hasMany(Challan::class);
	}

	public function merit_list_entries()
	{
		return $this->hasMany(MeritListEntry::class);
	}

	public function student()
	{
		return $this->hasOne(Student::class);
	}
}

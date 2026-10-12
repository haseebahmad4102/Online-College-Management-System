<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Challan
 * 
 * @property int $id
 * @property string $challan_no
 * @property int|null $application_id
 * @property int|null $student_id
 * @property int|null $department_id
 * @property string $purpose
 * @property float $total_amount
 * @property Carbon $due_date
 * @property string $status
 * @property string|null $paid_copy_path
 * @property Carbon|null $paid_on
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * @property string|null $remarks
 * @property Carbon $created_at
 * 
 * @property Application|null $application
 * @property Department|null $department
 * @property Student|null $student
 * @property Collection|ChallanItem[] $challan_items
 *
 * @package App\Models
 */
class Challan extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'challans';
	public $timestamps = false;

	protected $casts = [
		'application_id' => 'int',
		'student_id' => 'int',
		'department_id' => 'int',
		'total_amount' => 'float',
		'due_date' => 'datetime',
		'paid_on' => 'datetime',
		'verified_by' => 'int',
		'verified_at' => 'datetime'
	];

	protected $fillable = [
		'challan_no',
		'application_id',
		'student_id',
		'department_id',
		'purpose',
		'total_amount',
		'due_date',
		'status',
		'paid_copy_path',
		'paid_on',
		'verified_by',
		'verified_at',
		'remarks'
	];

	public function application()
	{
		return $this->belongsTo(Application::class);
	}

	public function department()
	{
		return $this->belongsTo(Department::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}

	public function challan_items()
	{
		return $this->hasMany(ChallanItem::class);
	}
}

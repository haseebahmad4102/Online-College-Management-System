<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class StudentCarryForward
 * 
 * @property int $id
 * @property int $student_id
 * @property int $subject_id
 * @property int $from_term_no
 * @property string $status
 * @property int|null $cleared_by
 * @property Carbon|null $cleared_at
 * @property Carbon $created_at
 * 
 * @property Student $student
 * @property Subject $subject
 *
 * @package App\Models
 */
class StudentCarryForward extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'student_carry_forwards';
	public $timestamps = false;

	protected $casts = [
		'student_id' => 'int',
		'subject_id' => 'int',
		'from_term_no' => 'int',
		'cleared_by' => 'int',
		'cleared_at' => 'datetime'
	];

	protected $fillable = [
		'student_id',
		'subject_id',
		'from_term_no',
		'status',
		'cleared_by',
		'cleared_at'
	];

	public function student()
	{
		return $this->belongsTo(Student::class);
	}

	public function subject()
	{
		return $this->belongsTo(Subject::class);
	}
}

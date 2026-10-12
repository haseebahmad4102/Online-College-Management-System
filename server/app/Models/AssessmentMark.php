<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class AssessmentMark
 * 
 * @property int $id
 * @property int $assessment_id
 * @property int $student_id
 * @property float|null $obtained
 * @property string|null $remarks
 * 
 * @property Assessment $assessment
 * @property Student $student
 *
 * @package App\Models
 */
class AssessmentMark extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'assessment_marks';
	public $timestamps = false;

	protected $casts = [
		'assessment_id' => 'int',
		'student_id' => 'int',
		'obtained' => 'float'
	];

	protected $fillable = [
		'assessment_id',
		'student_id',
		'obtained',
		'remarks'
	];

	public function assessment()
	{
		return $this->belongsTo(Assessment::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}

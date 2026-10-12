<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ClassworkSubmission
 * 
 * @property int $id
 * @property int $classwork_id
 * @property int $student_id
 * @property string|null $file_path
 * @property array|null $answers
 * @property Carbon $submitted_at
 * @property float|null $obtained
 * @property string|null $feedback
 * 
 * @property Classwork $classwork
 * @property Student $student
 *
 * @package App\Models
 */
class ClassworkSubmission extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'classwork_submissions';
	public $timestamps = false;

	protected $casts = [
		'classwork_id' => 'int',
		'student_id' => 'int',
		'answers' => 'json',
		'submitted_at' => 'datetime',
		'obtained' => 'float'
	];

	protected $fillable = [
		'classwork_id',
		'student_id',
		'file_path',
		'answers',
		'submitted_at',
		'obtained',
		'feedback'
	];

	public function classwork()
	{
		return $this->belongsTo(Classwork::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class CommitteeStudentMember
 * 
 * @property int $committee_id
 * @property int $student_id
 * @property string $position
 * 
 * @property Committee $committee
 * @property Student $student
 *
 * @package App\Models
 */
class CommitteeStudentMember extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'committee_student_members';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'committee_id' => 'int',
		'student_id' => 'int'
	];

	protected $fillable = [
		'committee_id',
		'student_id',
		'position'
	];

	public function committee()
	{
		return $this->belongsTo(Committee::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}

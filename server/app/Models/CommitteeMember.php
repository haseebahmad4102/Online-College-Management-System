<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class CommitteeMember
 * 
 * @property int $committee_id
 * @property int $teacher_id
 * @property string $position
 * 
 * @property Committee $committee
 * @property Teacher $teacher
 *
 * @package App\Models
 */
class CommitteeMember extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'committee_members';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'committee_id' => 'int',
		'teacher_id' => 'int'
	];

	protected $fillable = [
		'committee_id',
		'teacher_id',
		'position'
	];

	public function committee()
	{
		return $this->belongsTo(Committee::class);
	}

	public function teacher()
	{
		return $this->belongsTo(Teacher::class);
	}
}

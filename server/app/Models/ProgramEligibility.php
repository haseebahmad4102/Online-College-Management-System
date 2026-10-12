<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class ProgramEligibility
 * 
 * @property int $program_id
 * @property int $inter_group_id
 * 
 * @property InterGroup $inter_group
 * @property Program $program
 *
 * @package App\Models
 */
class ProgramEligibility extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'program_eligibilities';
	public $incrementing = false;
	public $timestamps = false;

	protected $casts = [
		'program_id' => 'int',
		'inter_group_id' => 'int',
		'matric_group_id' => 'int'
	];

	public function inter_group()
	{
		return $this->belongsTo(InterGroup::class);
	}

	public function matric_group()
	{
		return $this->belongsTo(MatricGroup::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}
}

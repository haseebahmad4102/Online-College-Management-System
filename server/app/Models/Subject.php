<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Subject
 * 
 * @property int $id
 * @property int $program_id
 * @property int $term_no
 * @property string $title
 * @property string $code
 * @property int|null $credit_hours
 * @property bool $is_active
 * 
 * @property Program $program
 * @property Collection|Allocation[] $allocations
 * @property Collection|StudentCarryForward[] $student_carry_forwards
 *
 * @package App\Models
 */
class Subject extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'subjects';
	public $timestamps = false;

	protected $casts = [
		'program_id' => 'int',
		'term_no' => 'int',
		'credit_hours' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'program_id',
		'term_no',
		'title',
		'code',
		'credit_hours',
		'is_active'
	];

	public function program()
	{
		return $this->belongsTo(Program::class);
	}

	public function allocations()
	{
		return $this->hasMany(Allocation::class);
	}

	public function student_carry_forwards()
	{
		return $this->hasMany(StudentCarryForward::class);
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Assessment
 * 
 * @property int $id
 * @property int $allocation_id
 * @property string $type
 * @property string $title
 * @property int $total_marks
 * @property Carbon|null $held_on
 * @property bool $is_published
 * @property Carbon $created_at
 * 
 * @property Allocation $allocation
 * @property Collection|AssessmentMark[] $assessment_marks
 *
 * @package App\Models
 */
class Assessment extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'assessments';
	public $timestamps = false;

	protected $casts = [
		'allocation_id' => 'int',
		'total_marks' => 'int',
		'held_on' => 'datetime',
		'is_published' => 'bool'
	];

	protected $fillable = [
		'allocation_id',
		'type',
		'title',
		'total_marks',
		'held_on',
		'is_published'
	];

	public function allocation()
	{
		return $this->belongsTo(Allocation::class);
	}

	public function assessment_marks()
	{
		return $this->hasMany(AssessmentMark::class);
	}
}

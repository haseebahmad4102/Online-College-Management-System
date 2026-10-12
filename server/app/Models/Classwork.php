<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Classwork
 * 
 * @property int $id
 * @property int $allocation_id
 * @property string $type
 * @property string $title
 * @property string|null $instructions
 * @property string|null $attachment_path
 * @property array|null $questions
 * @property int|null $total_marks
 * @property Carbon|null $due_at
 * @property bool $is_published
 * @property Carbon $created_at
 * 
 * @property Allocation $allocation
 * @property Collection|ClassworkSubmission[] $classwork_submissions
 * @property Collection|Lecture[] $lectures
 *
 * @package App\Models
 */
class Classwork extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'classworks';
	public $timestamps = false;

	protected $casts = [
		'allocation_id' => 'int',
		'questions' => 'json',
		'total_marks' => 'int',
		'due_at' => 'datetime',
		'is_published' => 'bool'
	];

	protected $fillable = [
		'allocation_id',
		'type',
		'title',
		'instructions',
		'attachment_path',
		'questions',
		'total_marks',
		'due_at',
		'is_published'
	];

	public function allocation()
	{
		return $this->belongsTo(Allocation::class);
	}

	public function classwork_submissions()
	{
		return $this->hasMany(ClassworkSubmission::class);
	}

	public function lectures()
	{
		return $this->hasMany(Lecture::class, 'quiz_id');
	}
}

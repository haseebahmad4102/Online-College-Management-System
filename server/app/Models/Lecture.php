<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Lecture
 * 
 * @property int $id
 * @property int $allocation_id
 * @property string $title
 * @property string|null $description
 * @property string $youtube_id
 * @property int|null $duration_mins
 * @property int|null $duration_sec
 * @property bool $is_published
 * @property int|null $quiz_id
 * @property int $posted_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Allocation $allocation
 * @property Classwork|null $classwork
 * @property Collection|LectureProgress[] $lecture_progresses
 *
 * @package App\Models
 */
class Lecture extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'lectures';

	protected $casts = [
		'allocation_id' => 'int',
		'duration_mins' => 'int',
		'duration_sec' => 'int',
		'is_published' => 'bool',
		'quiz_id' => 'int',
		'posted_by' => 'int'
	];

	protected $fillable = [
		'allocation_id',
		'title',
		'description',
		'youtube_id',
		'duration_mins',
		'duration_sec',
		'is_published',
		'strict_tracking',
		'quiz_id',
		'posted_by'
	];

	public function allocation()
	{
		return $this->belongsTo(Allocation::class);
	}

	public function classwork()
	{
		return $this->belongsTo(Classwork::class, 'quiz_id');
	}

	public function quiz()
	{
		return $this->classwork();
	}

	public function lecture_progresses()
	{
		return $this->hasMany(LectureProgress::class);
	}
}

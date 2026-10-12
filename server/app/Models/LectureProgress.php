<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class LectureProgress
 * 
 * @property int $id
 * @property int $lecture_id
 * @property int $student_id
 * @property int $watched_sec
 * @property int $furthest_sec
 * @property int $last_pos_sec
 * @property int $sessions
 * @property Carbon $started_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $last_seen_at
 * 
 * @property Lecture $lecture
 * @property Student $student
 *
 * @package App\Models
 */
class LectureProgress extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'lecture_progress';
	public $timestamps = false;

	protected $casts = [
		'lecture_id' => 'int',
		'student_id' => 'int',
		'watched_sec' => 'int',
		'furthest_sec' => 'int',
		'last_pos_sec' => 'int',
		'sessions' => 'int',
		'started_at' => 'datetime',
		'completed_at' => 'datetime',
		'last_seen_at' => 'datetime'
	];

	protected $fillable = [
		'lecture_id',
		'student_id',
		'watched_sec',
		'furthest_sec',
		'last_pos_sec',
		'sessions',
		'started_at',
		'completed_at',
		'last_seen_at'
	];

	public function lecture()
	{
		return $this->belongsTo(Lecture::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}

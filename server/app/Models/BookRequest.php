<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class BookRequest
 * 
 * @property int $id
 * @property int $book_id
 * @property int $student_id
 * @property int $days_requested
 * @property string $status
 * @property string|null $remarks
 * @property int|null $decided_by
 * @property Carbon|null $decided_at
 * @property Carbon $created_at
 * 
 * @property Book $book
 * @property Student $student
 * @property BookIssue|null $book_issue
 *
 * @package App\Models
 */
class BookRequest extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'book_requests';
	public $timestamps = false;

	protected $casts = [
		'book_id' => 'int',
		'student_id' => 'int',
		'days_requested' => 'int',
		'decided_by' => 'int',
		'decided_at' => 'datetime'
	];

	protected $fillable = [
		'book_id',
		'student_id',
		'days_requested',
		'status',
		'remarks',
		'decided_by',
		'decided_at'
	];

	public function book()
	{
		return $this->belongsTo(Book::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}

	public function book_issue()
	{
		return $this->hasOne(BookIssue::class);
	}
}

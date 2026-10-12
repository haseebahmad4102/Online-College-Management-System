<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class BookIssue
 * 
 * @property int $id
 * @property int $book_id
 * @property int $student_id
 * @property int|null $book_request_id
 * @property int $issued_by
 * @property Carbon $issued_on
 * @property Carbon $due_date
 * @property Carbon|null $returned_on
 * @property int|null $received_by
 * @property float $fine_per_day
 * @property float $fine_amount
 * @property string $fine_status
 * 
 * @property Book $book
 * @property BookRequest|null $book_request
 * @property Student $student
 *
 * @package App\Models
 */
class BookIssue extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'book_issues';
	public $timestamps = false;

	protected $casts = [
		'book_id' => 'int',
		'student_id' => 'int',
		'book_request_id' => 'int',
		'issued_by' => 'int',
		'issued_on' => 'datetime',
		'due_date' => 'datetime',
		'returned_on' => 'datetime',
		'received_by' => 'int',
		'fine_per_day' => 'float',
		'fine_amount' => 'float'
	];

	protected $fillable = [
		'book_id',
		'student_id',
		'book_request_id',
		'issued_by',
		'issued_on',
		'due_date',
		'returned_on',
		'received_by',
		'fine_per_day',
		'fine_amount',
		'fine_status'
	];

	public function book()
	{
		return $this->belongsTo(Book::class);
	}

	public function book_request()
	{
		return $this->belongsTo(BookRequest::class);
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}

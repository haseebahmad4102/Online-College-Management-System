<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Book
 * 
 * @property int $id
 * @property string $title
 * @property string $author
 * @property string|null $isbn
 * @property string|null $publisher
 * @property string|null $edition
 * @property int $category_id
 * @property string|null $shelf_location
 * @property int $total_copies
 * @property int $available_copies
 * @property string|null $cover_path
 * @property bool $is_active
 * @property Carbon $created_at
 * 
 * @property BookCategory $book_category
 * @property Collection|BookIssue[] $book_issues
 * @property Collection|BookRequest[] $book_requests
 *
 * @package App\Models
 */
class Book extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'books';
	public $timestamps = false;

	protected $casts = [
		'category_id' => 'int',
		'total_copies' => 'int',
		'available_copies' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'title',
		'author',
		'isbn',
		'publisher',
		'edition',
		'category_id',
		'shelf_location',
		'total_copies',
		'available_copies',
		'cover_path',
		'is_active'
	];

	public function book_category()
	{
		return $this->belongsTo(BookCategory::class, 'category_id');
	}

	public function book_issues()
	{
		return $this->hasMany(BookIssue::class);
	}

	public function book_requests()
	{
		return $this->hasMany(BookRequest::class);
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class BookCategory
 * 
 * @property int $id
 * @property string $name
 * 
 * @property Collection|Book[] $books
 *
 * @package App\Models
 */
class BookCategory extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'book_categories';
	public $timestamps = false;

	protected $fillable = [
		'name'
	];

	public function books()
	{
		return $this->hasMany(Book::class, 'category_id');
	}
}

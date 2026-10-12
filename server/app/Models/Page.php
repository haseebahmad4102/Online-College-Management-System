<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Page
 * 
 * @property int $id
 * @property string $title
 * @property string $slug
 * @property string $content
 * @property bool $is_published
 * @property int|null $updated_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 *
 * @package App\Models
 */
class Page extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'pages';

	protected $casts = [
		'is_published' => 'bool',
		'updated_by' => 'int'
	];

	protected $fillable = [
		'title',
		'slug',
		'content',
		'is_published',
		'updated_by'
	];
}

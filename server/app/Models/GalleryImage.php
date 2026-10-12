<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class GalleryImage
 * 
 * @property int $id
 * @property string $image_path
 * @property string|null $caption
 * @property int $sort_order
 * @property bool $is_active
 * @property Carbon $created_at
 *
 * @package App\Models
 */
class GalleryImage extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'gallery_images';
	public $timestamps = false;

	protected $casts = [
		'sort_order' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'image_path',
		'caption',
		'sort_order',
		'is_active'
	];
}

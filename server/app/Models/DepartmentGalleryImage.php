<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DepartmentGalleryImage
 * 
 * @property int $id
 * @property int $department_id
 * @property string $image_path
 * @property string|null $caption
 * @property int $sort_order
 * @property Carbon $created_at
 * 
 * @property Department $department
 *
 * @package App\Models
 */
class DepartmentGalleryImage extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'department_gallery_images';
	public $timestamps = false;

	protected $casts = [
		'department_id' => 'int',
		'sort_order' => 'int'
	];

	protected $fillable = [
		'department_id',
		'image_path',
		'caption',
		'sort_order'
	];

	public function department()
	{
		return $this->belongsTo(Department::class);
	}
}

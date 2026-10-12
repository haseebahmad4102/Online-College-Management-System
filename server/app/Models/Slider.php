<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Slider
 * 
 * @property int $id
 * @property string|null $image_path
 * @property string|null $heading
 * @property string|null $subheading
 * @property int $sort_order
 * @property bool $is_active
 *
 * @package App\Models
 */
class Slider extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'sliders';
	public $timestamps = false;

	protected $casts = [
		'sort_order' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'image_path',
		'heading',
		'subheading',
		'sort_order',
		'is_active'
	];
}

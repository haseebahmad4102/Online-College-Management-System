<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Setting
 * 
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property string $group
 *
 * @package App\Models
 */
class Setting extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'settings';
	public $timestamps = false;

	protected $fillable = [
		'key',
		'value',
		'group'
	];
}

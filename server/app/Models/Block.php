<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Block
 * 
 * @property int $id
 * @property string $name
 * @property bool $is_active
 * @property Carbon $created_at
 * 
 * @property Collection|Room[] $rooms
 *
 * @package App\Models
 */
class Block extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'blocks';
	public $timestamps = false;

	protected $casts = [
		'is_active' => 'bool'
	];

	protected $fillable = [
		'name',
		'is_active'
	];

	public function rooms()
	{
		return $this->hasMany(Room::class);
	}
}

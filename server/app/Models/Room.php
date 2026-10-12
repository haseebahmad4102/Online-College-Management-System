<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Room
 * 
 * @property int $id
 * @property int|null $block_id
 * @property int|null $department_id
 * @property string $name
 * @property string $type
 * @property int|null $capacity
 * @property bool $is_active
 * 
 * @property Block|null $block
 * @property Department|null $department
 * @property Collection|TimetableEntry[] $timetable_entries
 *
 * @package App\Models
 */
class Room extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'rooms';
	public $timestamps = false;

	protected $casts = [
		'block_id' => 'int',
		'department_id' => 'int',
		'capacity' => 'int',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'block_id',
		'department_id',
		'name',
		'type',
		'capacity',
		'is_active'
	];

	public function block()
	{
		return $this->belongsTo(Block::class);
	}

	public function department()
	{
		return $this->belongsTo(Department::class);
	}

	public function timetable_entries()
	{
		return $this->hasMany(TimetableEntry::class);
	}
}

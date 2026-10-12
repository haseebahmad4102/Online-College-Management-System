<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TimeSlot
 * 
 * @property int $id
 * @property string $name
 * @property string $start_time
 * @property string $end_time
 * @property string $shift
 * @property int $sort_order
 * 
 * @property Collection|TimetableEntry[] $timetable_entries
 *
 * @package App\Models
 */
class TimeSlot extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'time_slots';
	public $timestamps = false;

	protected $casts = [
		'sort_order' => 'int'
	];

	protected $fillable = [
		'name',
		'start_time',
		'end_time',
		'shift',
		'sort_order'
	];

	public function timetable_entries()
	{
		return $this->hasMany(TimetableEntry::class);
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AttendanceSheet
 * 
 * @property int $id
 * @property int $allocation_id
 * @property Carbon $date
 * @property int $marked_by
 * @property Carbon|null $locked_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Allocation $allocation
 * @property Collection|AttendanceRecord[] $attendance_records
 *
 * @package App\Models
 */
class AttendanceSheet extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'attendance_sheets';

	protected $casts = [
		'allocation_id' => 'int',
		'date' => 'datetime',
		'marked_by' => 'int',
		'locked_at' => 'datetime'
	];

	protected $fillable = [
		'allocation_id',
		'date',
		'marked_by',
		'locked_at'
	];

	public function allocation()
	{
		return $this->belongsTo(Allocation::class);
	}

	public function attendance_records()
	{
		return $this->hasMany(AttendanceRecord::class);
	}
}

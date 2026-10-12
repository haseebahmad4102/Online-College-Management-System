<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class TimetableEntry
 * 
 * @property int $id
 * @property int $allocation_id
 * @property int $academic_session_id
 * @property string $day
 * @property int $time_slot_id
 * @property int $room_id
 * @property int $teacher_id
 * @property int $class_section_id
 * 
 * @property AcademicSession $academic_session
 * @property Allocation $allocation
 * @property ClassSection $class_section
 * @property Room $room
 * @property Teacher $teacher
 * @property TimeSlot $time_slot
 *
 * @package App\Models
 */
class TimetableEntry extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'timetable_entries';
	public $timestamps = false;

	protected $casts = [
		'allocation_id' => 'int',
		'academic_session_id' => 'int',
		'time_slot_id' => 'int',
		'room_id' => 'int',
		'teacher_id' => 'int',
		'class_section_id' => 'int'
	];

	protected $fillable = [
		'allocation_id',
		'academic_session_id',
		'day',
		'time_slot_id',
		'room_id',
		'teacher_id',
		'class_section_id'
	];

	public function academic_session()
	{
		return $this->belongsTo(AcademicSession::class);
	}

	public function allocation()
	{
		return $this->belongsTo(Allocation::class);
	}

	public function class_section()
	{
		return $this->belongsTo(ClassSection::class);
	}

	public function room()
	{
		return $this->belongsTo(Room::class);
	}

	public function teacher()
	{
		return $this->belongsTo(Teacher::class);
	}

	public function time_slot()
	{
		return $this->belongsTo(TimeSlot::class);
	}
}

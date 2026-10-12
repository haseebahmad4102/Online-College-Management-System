<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class AttendanceRecord
 * 
 * @property int $id
 * @property int $attendance_sheet_id
 * @property int $student_id
 * @property string $status
 * 
 * @property AttendanceSheet $attendance_sheet
 * @property Student $student
 *
 * @package App\Models
 */
class AttendanceRecord extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'attendance_records';
	public $timestamps = false;

	protected $casts = [
		'attendance_sheet_id' => 'int',
		'student_id' => 'int'
	];

	protected $fillable = [
		'attendance_sheet_id',
		'student_id',
		'status'
	];

	public function attendance_sheet()
	{
		return $this->belongsTo(AttendanceSheet::class);
	}

	public function sheet()
	{
		return $this->attendance_sheet();
	}

	public function student()
	{
		return $this->belongsTo(Student::class);
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AdmissionCycle
 * 
 * @property int $id
 * @property int $academic_session_id
 * @property int|null $program_level_id
 * @property string $title
 * @property Carbon $start_at
 * @property Carbon $end_at
 * @property float|null $merit_w_matric
 * @property float|null $merit_w_inter
 * @property int|null $hafiz_bonus
 * @property int $challan_due_days
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property AcademicSession $academic_session
 * @property Collection|Application[] $applications
 * @property Collection|MeritList[] $merit_lists
 *
 * @package App\Models
 */
class AdmissionCycle extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'admission_cycles';

	protected $casts = [
		'academic_session_id' => 'int',
		'start_at' => 'datetime',
		'end_at' => 'datetime',
		'merit_w_matric' => 'float',
		'merit_w_inter' => 'float',
		'hafiz_bonus' => 'int',
		'challan_due_days' => 'int'
	];

	protected $fillable = [
		'academic_session_id',
		'program_level_id',
		'title',
		'start_at',
		'end_at',
		'merit_w_matric',
		'merit_w_inter',
		'hafiz_bonus',
		'challan_due_days',
		'status'
	];

	public function academic_session()
	{
		return $this->belongsTo(AcademicSession::class);
	}

	public function level()
	{
		return $this->belongsTo(ProgramLevel::class, 'program_level_id');
	}

	public function applications()
	{
		return $this->hasMany(Application::class);
	}

	public function merit_lists()
	{
		return $this->hasMany(MeritList::class);
	}
}

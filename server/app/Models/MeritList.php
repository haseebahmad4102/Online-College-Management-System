<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class MeritList
 * 
 * @property int $id
 * @property int $admission_cycle_id
 * @property int $program_id
 * @property int $list_no
 * @property int $seats
 * @property float|null $cutoff_score
 * @property string $status
 * @property int $generated_by
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property AdmissionCycle $admission_cycle
 * @property Program $program
 * @property Collection|MeritListEntry[] $merit_list_entries
 * @property Collection|Notice[] $notices
 *
 * @package App\Models
 */
class MeritList extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'merit_lists';

	const UPDATED_AT = null;

	protected $casts = [
		'admission_cycle_id' => 'int',
		'program_id' => 'int',
		'list_no' => 'int',
		'seats' => 'int',
		'cutoff_score' => 'float',
		'generated_by' => 'int',
		'published_at' => 'datetime'
	];

	protected $fillable = [
		'admission_cycle_id',
		'program_id',
		'list_no',
		'seats',
		'cutoff_score',
		'status',
		'generated_by',
		'published_at'
	];

	public function admission_cycle()
	{
		return $this->belongsTo(AdmissionCycle::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}

	public function merit_list_entries()
	{
		return $this->hasMany(MeritListEntry::class);
	}

	public function notices()
	{
		return $this->hasMany(Notice::class);
	}
}

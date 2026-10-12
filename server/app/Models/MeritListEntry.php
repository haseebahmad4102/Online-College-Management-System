<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class MeritListEntry
 * 
 * @property int $id
 * @property int $merit_list_id
 * @property int $application_id
 * @property int $position
 * @property float $merit_score
 * @property string $status
 * 
 * @property Application $application
 * @property MeritList $merit_list
 *
 * @package App\Models
 */
class MeritListEntry extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'merit_list_entries';
	public $timestamps = false;

	protected $casts = [
		'merit_list_id' => 'int',
		'application_id' => 'int',
		'position' => 'int',
		'merit_score' => 'float'
	];

	protected $fillable = [
		'merit_list_id',
		'application_id',
		'position',
		'merit_score',
		'status'
	];

	public function application()
	{
		return $this->belongsTo(Application::class);
	}

	public function merit_list()
	{
		return $this->belongsTo(MeritList::class);
	}
}

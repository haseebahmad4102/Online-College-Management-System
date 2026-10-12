<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Notice
 * 
 * @property int $id
 * @property string $title
 * @property string $body
 * @property string|null $attachment_path
 * @property string $audience
 * @property int|null $program_id
 * @property int|null $merit_list_id
 * @property Carbon $published_at
 * @property Carbon|null $expires_at
 * @property int $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property MeritList|null $merit_list
 * @property Program|null $program
 *
 * @package App\Models
 */
class Notice extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'notices';

	protected $casts = [
		'program_id' => 'int',
		'merit_list_id' => 'int',
		'published_at' => 'datetime',
		'expires_at' => 'datetime',
		'created_by' => 'int'
	];

	protected $fillable = [
		'title',
		'body',
		'attachment_path',
		'audience',
		'program_id',
		'merit_list_id',
		'published_at',
		'expires_at',
		'created_by'
	];

	public function merit_list()
	{
		return $this->belongsTo(MeritList::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}
}

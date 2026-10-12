<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Notification
 * 
 * @property int $id
 * @property int $user_id
 * @property string $type
 * @property string $title
 * @property string|null $body
 * @property string|null $link
 * @property Carbon|null $read_at
 * @property Carbon $created_at
 *
 * @package App\Models
 */
class Notification extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'notifications';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'read_at' => 'datetime'
	];

	protected $fillable = [
		'user_id',
		'type',
		'title',
		'body',
		'link',
		'read_at'
	];
}

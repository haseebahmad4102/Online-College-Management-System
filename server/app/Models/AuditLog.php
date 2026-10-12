<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AuditLog
 * 
 * @property int $id
 * @property int|null $user_id
 * @property string|null $user_name
 * @property string|null $user_roles
 * @property string $method
 * @property string $path
 * @property string $action
 * @property int $status
 * @property array|null $summary
 * @property string|null $ip
 * @property Carbon $created_at
 *
 * @package App\Models
 */
class AuditLog extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'audit_logs';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'status' => 'int',
		'summary' => 'json'
	];

	protected $fillable = [
		'user_id',
		'user_name',
		'user_roles',
		'method',
		'path',
		'action',
		'status',
		'summary',
		'ip'
	];
}

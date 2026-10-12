<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class UserHasPermission
 * 
 * @property int $user_id
 * @property int $permission_id
 * 
 * @property Permission $permission
 * @property User $user
 *
 * @package App\Models
 */
class UserHasPermission extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'user_has_permissions';
	public $incrementing = false;
	public $timestamps = false;
	
	protected $fillable = ['user_id', 'permission_id', 'expires_at'];

	protected $casts = [
		'user_id' => 'int',
		'permission_id' => 'int',
		'expires_at' => 'datetime'
	];

	public function permission()
	{
		return $this->belongsTo(Permission::class);
	}

	public function user()
	{
		return $this->belongsTo(User::class);
	}
}

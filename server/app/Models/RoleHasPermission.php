<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class RoleHasPermission
 * 
 * @property int $role_id
 * @property int $permission_id
 * 
 * @property Permission $permission
 * @property Role $role
 *
 * @package App\Models
 */
class RoleHasPermission extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'role_has_permissions';
	public $incrementing = false;
	public $timestamps = false;
	
	protected $fillable = ['role_id', 'permission_id'];

	protected $casts = [
		'role_id' => 'int',
		'permission_id' => 'int'
	];

	public function permission()
	{
		return $this->belongsTo(Permission::class);
	}

	public function role()
	{
		return $this->belongsTo(Role::class);
	}
}

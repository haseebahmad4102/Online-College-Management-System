<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Permission
 * 
 * @property int $id
 * @property string $name
 * @property string $group
 * @property string $label
 * 
 * @property Collection|Role[] $roles
 * @property Collection|User[] $users
 *
 * @package App\Models
 */
class Permission extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'permissions';
	public $timestamps = false;

	protected $fillable = [
		'name',
		'group',
		'label'
	];

	public function roles()
	{
		return $this->belongsToMany(Role::class, 'role_has_permissions');
	}

	public function users()
	{
		return $this->belongsToMany(User::class, 'user_has_permissions');
	}
}

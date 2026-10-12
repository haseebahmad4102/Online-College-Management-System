<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Role
 * 
 * @property int $id
 * @property string $name
 * 
 * @property Collection|Permission[] $permissions
 * @property Collection|User[] $users
 *
 * @package App\Models
 */
class Role extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'roles';
	public $timestamps = false;

	protected $fillable = [
		'name'
	];

	public function permissions()
	{
		return $this->belongsToMany(Permission::class, 'role_has_permissions');
	}

	public function users()
	{
		return $this->belongsToMany(User::class, 'user_roles');
	}
}

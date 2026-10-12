<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Class User
 * 
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string|null $phone
 * @property string|null $cnic
 * @property string $password
 * @property string|null $avatar_path
 * @property bool $must_change_password
 * @property bool $is_active
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Collection|Application[] $applications
 * @property Student|null $student
 * @property Teacher|null $teacher
 * @property Collection|Permission[] $permissions
 * @property Collection|Role[] $roles
 *
 * @package App\Models
 */
class User extends Authenticatable
{
	use \App\Models\Traits\CamelCaseRelations;

	use HasApiTokens, Notifiable;

	protected $table = 'users';

	protected $casts = [
		'email_verified_at' => 'datetime',
		'must_change_password' => 'bool',
		'is_active' => 'bool'
	];

	protected $hidden = [
		'password',
		'must_change_password',
		'remember_token'
	];

	protected $fillable = [
		'name',
		'email',
		'email_verified_at',
		'phone',
		'cnic',
		'password',
		'avatar_path',
		'must_change_password',
		'is_active',
		'remember_token'
	];

	public function applications()
	{
		return $this->hasMany(Application::class);
	}

	public function student()
	{
		return $this->hasOne(Student::class);
	}

	public function teacher()
	{
		return $this->hasOne(Teacher::class);
	}

	public function permissions()
	{
		return $this->belongsToMany(Permission::class, 'user_has_permissions')->withPivot('expires_at');
	}

	public function roles()
	{
		return $this->belongsToMany(Role::class, 'user_roles');
	}

	public function hasPermission($permissionName)
	{
		if ($this->hasRole('admin')) {
			return true;
		}

		$userPerm = $this->permissions->firstWhere('name', $permissionName);
		if ($userPerm) {
			if (!$userPerm->pivot->expires_at || \Carbon\Carbon::parse($userPerm->pivot->expires_at)->isFuture()) {
				return true;
			}
		}
		
		foreach ($this->roles as $role) {
			if ($role->permissions->contains('name', $permissionName)) {
				return true;
			}
		}
		
		return false;
	}

	public function hasRole($roleName)
	{
		return $this->roles->contains('name', $roleName);
	}
}

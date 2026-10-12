<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class InterGroup
 * 
 * @property int $id
 * @property string $name
 * @property string $code
 * 
 * @property Collection|Application[] $applications
 * @property Collection|ProgramEligibility[] $program_eligibilities
 * @property Collection|Program[] $programs
 * @property Collection|Student[] $students
 *
 * @package App\Models
 */
class InterGroup extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'inter_groups';
	public $timestamps = false;

	protected $fillable = [
		'name',
		'code'
	];

	public function applications()
	{
		return $this->hasMany(Application::class);
	}

	public function program_eligibilities()
	{
		return $this->hasMany(ProgramEligibility::class);
	}

	public function programs()
	{
		return $this->hasMany(Program::class);
	}

	public function students()
	{
		return $this->hasMany(Student::class);
	}
}

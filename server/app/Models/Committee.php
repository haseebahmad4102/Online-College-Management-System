<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Committee
 * 
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Collection|CommitteeMember[] $committee_members
 * @property Collection|Student[] $students
 *
 * @package App\Models
 */
class Committee extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'committees';

	protected $fillable = [
		'name',
		'description'
	];

	public function committee_members()
	{
		return $this->hasMany(CommitteeMember::class);
	}

	public function students()
	{
		return $this->belongsToMany(Student::class, 'committee_student_members')
					->withPivot('position');
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Designation
 * 
 * @property int $id
 * @property string $title
 * 
 * @property Collection|Teacher[] $teachers
 *
 * @package App\Models
 */
class Designation extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'designations';
	public $timestamps = false;

	protected $fillable = [
		'title'
	];

	public function teachers()
	{
		return $this->hasMany(Teacher::class);
	}
}

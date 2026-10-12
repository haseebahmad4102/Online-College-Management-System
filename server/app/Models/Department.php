<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Department
 * 
 * @property int $id
 * @property string $name
 * @property string $code
 * @property string|null $description
 * @property string|null $message
 * @property int|null $hod_teacher_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * 
 * @property Teacher|null $teacher
 * @property Collection|Challan[] $challans
 * @property Collection|DepartmentFeeItem[] $department_fee_items
 * @property Collection|DepartmentGalleryImage[] $department_gallery_images
 * @property Collection|Program[] $programs
 * @property Collection|Room[] $rooms
 * @property Collection|Teacher[] $teachers
 *
 * @package App\Models
 */
class Department extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'departments';

	protected $casts = [
		'hod_teacher_id' => 'int'
	];

	protected $fillable = [
		'name',
		'code',
		'description',
		'message',
		'hod_teacher_id'
	];

	public function teacher()
	{
		return $this->belongsTo(Teacher::class, 'hod_teacher_id');
	}

	public function challans()
	{
		return $this->hasMany(Challan::class);
	}

	public function department_fee_items()
	{
		return $this->hasMany(DepartmentFeeItem::class);
	}

	public function department_gallery_images()
	{
		return $this->hasMany(DepartmentGalleryImage::class);
	}

	public function programs()
	{
		return $this->hasMany(Program::class);
	}

	public function rooms()
	{
		return $this->hasMany(Room::class);
	}

	public function teachers()
	{
		return $this->hasMany(Teacher::class);
	}
}

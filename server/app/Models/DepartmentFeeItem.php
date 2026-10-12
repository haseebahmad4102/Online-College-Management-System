<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DepartmentFeeItem
 * 
 * @property int $id
 * @property int $department_id
 * @property string $label
 * @property float $amount
 * @property bool $is_active
 * @property Carbon $created_at
 * 
 * @property Department $department
 *
 * @package App\Models
 */
class DepartmentFeeItem extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'department_fee_items';
	public $timestamps = false;

	protected $casts = [
		'department_id' => 'int',
		'amount' => 'float',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'department_id',
		'label',
		'amount',
		'is_active'
	];

	public function department()
	{
		return $this->belongsTo(Department::class);
	}
}

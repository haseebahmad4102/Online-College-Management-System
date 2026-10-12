<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class FeeHead
 * 
 * @property int $id
 * @property string $name
 * @property bool $is_active
 * 
 * @property Collection|ProgramFeeItem[] $program_fee_items
 *
 * @package App\Models
 */
class FeeHead extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'fee_heads';
	public $timestamps = false;

	protected $casts = [
		'is_active' => 'bool'
	];

	protected $fillable = [
		'name',
		'is_active'
	];

	public function program_fee_items()
	{
		return $this->hasMany(ProgramFeeItem::class);
	}
}

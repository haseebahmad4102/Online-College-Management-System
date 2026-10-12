<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class ProgramFeeItem
 * 
 * @property int $id
 * @property int $program_id
 * @property int $fee_head_id
 * @property float $amount
 * 
 * @property FeeHead $fee_head
 * @property Program $program
 *
 * @package App\Models
 */
class ProgramFeeItem extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'program_fee_items';
	public $timestamps = false;

	protected $casts = [
		'program_id' => 'int',
		'fee_head_id' => 'int',
		'amount' => 'float'
	];

	protected $fillable = [
		'program_id',
		'fee_head_id',
		'amount'
	];

	public function fee_head()
	{
		return $this->belongsTo(FeeHead::class);
	}

	public function program()
	{
		return $this->belongsTo(Program::class);
	}
}

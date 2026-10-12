<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class ChallanItem
 * 
 * @property int $id
 * @property int $challan_id
 * @property string $label
 * @property float $amount
 * 
 * @property Challan $challan
 *
 * @package App\Models
 */
class ChallanItem extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'challan_items';
	public $timestamps = false;

	protected $casts = [
		'challan_id' => 'int',
		'amount' => 'float'
	];

	protected $fillable = [
		'challan_id',
		'label',
		'amount'
	];

	public function challan()
	{
		return $this->belongsTo(Challan::class);
	}
}

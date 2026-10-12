<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class DocumentType
 * 
 * @property int $id
 * @property string $name
 * @property bool $is_required
 * @property bool $is_active
 * 
 * @property Collection|ApplicationDocument[] $application_documents
 *
 * @package App\Models
 */
class DocumentType extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'document_types';
	public $timestamps = false;

	protected $casts = [
		'is_required' => 'bool',
		'is_active' => 'bool'
	];

	protected $fillable = [
		'name',
		'is_required',
		'is_active'
	];

	public function programLevels()
	{
		return $this->belongsToMany(ProgramLevel::class, 'document_type_program_level');
	}

	public function applicationDocuments()
	{
		return $this->hasMany(ApplicationDocument::class);
	}
}

<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ApplicationDocument
 * 
 * @property int $id
 * @property int $application_id
 * @property int $document_type_id
 * @property string $file_path
 * @property string $status
 * @property string|null $remarks
 * @property int|null $verified_by
 * @property Carbon|null $verified_at
 * 
 * @property Application $application
 * @property DocumentType $document_type
 *
 * @package App\Models
 */
class ApplicationDocument extends Model
{
	use \App\Models\Traits\CamelCaseRelations;

	protected $table = 'application_documents';
	public $timestamps = false;

	protected $casts = [
		'application_id' => 'int',
		'document_type_id' => 'int',
		'verified_by' => 'int',
		'verified_at' => 'datetime'
	];

	protected $fillable = [
		'application_id',
		'document_type_id',
		'file_path',
		'status',
		'remarks',
		'verified_by',
		'verified_at'
	];

	public function application()
	{
		return $this->belongsTo(Application::class);
	}

	public function document_type()
	{
		return $this->belongsTo(DocumentType::class);
	}
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Building extends Model
{
    use \App\Models\Traits\CamelCaseRelations;

    protected $fillable = [
        'name',
        'code',
        'description'
    ];

    public function assets()
    {
        return $this->hasMany(Asset::class);
    }
}

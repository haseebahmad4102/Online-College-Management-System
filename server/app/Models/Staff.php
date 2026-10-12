<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Staff extends Model
{
    use \App\Models\Traits\CamelCaseRelations;

    protected $fillable = [
        'user_id',
        'name',
        'cnic',
        'phone',
        'designation',
        'status'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

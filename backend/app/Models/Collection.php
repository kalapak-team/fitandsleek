<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Collection extends Model
{
    protected $fillable = [
        'name','gender','slug','image_url','text_position','link',
        'sort_order','is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

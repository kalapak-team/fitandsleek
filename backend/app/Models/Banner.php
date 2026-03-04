<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Banner extends Model
{
    protected $fillable = [
        'page','sort_order','title','subtitle','image_url','link_url',
        'position','is_active','order'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer',
        'order' => 'integer',
    ];
}

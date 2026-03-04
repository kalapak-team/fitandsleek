<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Brand extends Model
{
    protected $fillable = [
        'name','slug','logo_path','sort_order','is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}

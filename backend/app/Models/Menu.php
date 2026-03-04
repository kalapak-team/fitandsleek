<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model
{
    protected $fillable = [
        'title','slug','groups',
        'promo_title','promo_subtitle','promo_image_path','promo_link',
        'sort_order','is_active',
    ];

    protected $casts = [
        'groups' => 'array',
        'is_active' => 'boolean',
    ];
}

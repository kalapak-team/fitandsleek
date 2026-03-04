<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Address extends Model
{
    use HasFactory;

    protected $appends = [
        'formatted_address',
    ];

    protected $fillable = [
        'user_id',
        'label',
        'receiver_name',
        'receiver_phone',
        'house_no',
        'street_no',
        'sangkat',
        'khan',
        'province',
        'landmark',
        'street',
        'city',
        'state',
        'zip',
        'country',
        'latitude',
        'longitude',
        'is_default',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getFormattedAddressAttribute(): string
    {
        $parts = [];

        if ($this->house_no) {
            $parts[] = 'ផ្ទះលេខ: ' . $this->house_no;
        }
        if ($this->street_no) {
            $parts[] = 'ផ្លូវ: ' . $this->street_no;
        }
        if ($this->sangkat) {
            $parts[] = 'សង្កាត់/ឃុំ: ' . $this->sangkat;
        }
        if ($this->khan) {
            $parts[] = 'ខណ្ឌ/ស្រុក: ' . $this->khan;
        }
        if ($this->province) {
            $parts[] = 'រាជធានី/ខេត្ត: ' . $this->province;
        }
        if ($this->landmark) {
            $parts[] = 'ចំណុចសម្គាល់: ' . $this->landmark;
        }

        return implode(', ', $parts);
    }
}

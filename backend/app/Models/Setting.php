<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
    ];

    public $timestamps = false;

    // Get value as specific type
    public function getValueAttribute($value)
    {
        if (!$value) return $value;

        return match ($this->type) {
            'number' => (float) $value,
            'boolean' => $value === 'true' || $value === '1',
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    // Set value with automatic type detection
    public function setValueAttribute($value)
    {
        if (is_array($value) || is_object($value)) {
            $this->attributes['type'] = 'json';
            $this->attributes['value'] = json_encode($value);
        } elseif (is_bool($value)) {
            $this->attributes['type'] = 'boolean';
            $this->attributes['value'] = $value ? 'true' : 'false';
        } elseif (is_numeric($value)) {
            $this->attributes['type'] = 'number';
            $this->attributes['value'] = (string) $value;
        } else {
            $this->attributes['type'] = 'string';
            $this->attributes['value'] = (string) $value;
        }
    }
}


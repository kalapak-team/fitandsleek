<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingAdminController extends Controller
{
    public function index()
    {
        return Setting::orderBy('group')->orderBy('key')->get()->groupBy('group');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'key' => ['required', 'string', 'max:100', 'unique:settings,key'],
            'value' => ['nullable'],
            'type' => ['nullable', 'string', 'max:20'],
            'group' => ['nullable', 'string', 'max:50'],
        ]);

        $setting = Setting::create($data);
        return response()->json($setting, 201);
    }

    public function show(Setting $setting)
    {
        return $setting;
    }

    public function update(Request $request, Setting $setting)
    {
        $data = $request->validate([
            'value' => ['nullable'],
            'type' => ['nullable', 'string', 'max:20'],
            'group' => ['nullable', 'string', 'max:50'],
        ]);

        // Handle value based on type
        if ($request->has('value')) {
            $data['value'] = $request->value;
        }

        $setting->update($data);
        return $setting;
    }

    public function destroy(Setting $setting)
    {
        $setting->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // Bulk update settings
    public function bulkUpdate(Request $request)
    {
        $data = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        foreach ($data['settings'] as $item) {
            if (is_array($item) && array_key_exists('key', $item)) {
                $key = $item['key'];
                $value = $item['value'] ?? null;
            } else {
                $key = $item;
                $value = null;
            }

            if (!$key) {
                continue;
            }

            $group = 'general';
            if (str_starts_with($key, 'social_')) {
                $group = 'social';
            } elseif (in_array($key, ['currency', 'tax_rate', 'free_shipping_threshold'], true)) {
                $group = 'commerce';
            } elseif (in_array($key, ['font_en', 'font_km'], true)) {
                $group = 'appearance';
            } elseif (in_array($key, ['privacy_content', 'terms_content'], true)) {
                $group = 'legal';
            }

            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value, 'group' => $group]
            );
        }

        return $this->index();
    }
}


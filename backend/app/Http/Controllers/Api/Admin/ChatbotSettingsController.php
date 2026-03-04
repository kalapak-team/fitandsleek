<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class ChatbotSettingsController extends Controller
{
    private function defaults(): array
    {
        return [
            'enabled' => true,
            'greeting' => 'Hi there 👋',
            'welcome' => 'How can we help you today?',
            'messenger_url' => '',
            'telegram_url' => '',
            'instagram_url' => '',
            'social_links' => [],
        ];
    }

    public function show()
    {
        $row = Setting::where('key', 'chatbot')->first();
        $value = is_array($row?->value) ? $row->value : [];

        return response()->json([
            'data' => array_merge($this->defaults(), $value),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'enabled' => 'boolean',
            'greeting' => 'nullable|string|max:120',
            'welcome' => 'nullable|string|max:200',
            'messenger_url' => 'nullable|string|max:255',
            'telegram_url' => 'nullable|string|max:255',
            'instagram_url' => 'nullable|string|max:255',
            'social_links' => 'nullable|string',
        ]);

        // Decode social_links JSON string into a native array for storage
        if (isset($data['social_links'])) {
            $decoded = json_decode($data['social_links'], true);
            $data['social_links'] = is_array($decoded) ? $decoded : [];
        }

        $row = Setting::firstOrNew(['key' => 'chatbot']);
        $row->group = 'chatbot';
        $row->value = array_merge($this->defaults(), $data);
        $row->save();

        return response()->json([
            'message' => 'Chatbot settings updated',
            'data' => $row->value,
        ]);
    }
}
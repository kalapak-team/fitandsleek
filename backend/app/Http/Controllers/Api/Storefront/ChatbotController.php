<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;

class ChatbotController extends Controller
{
    private function fetchAvailableModel(?string $apiKey): ?string
    {
        if (!$apiKey)
            return null;

        $verifyOption = $this->verifyOption();

        try {
            /** @var Response $resp */
            $resp = Http::timeout(10)
                ->withOptions(['verify' => $verifyOption])
                ->withQueryParameters(['key' => $apiKey])
                ->get('https://generativelanguage.googleapis.com/v1beta/models');

            if ($resp->status() < 200 || $resp->status() >= 300) {
                return null;
            }

            $data = json_decode($resp->body(), true) ?: [];
            $models = $data['models'] ?? [];

            $supported = array_filter($models, function ($m) {
                $methods = $m['supportedGenerationMethods'] ?? [];
                return in_array('generateContent', $methods, true);
            });

            $names = array_values(array_map(fn($m) => $m['name'] ?? '', $supported));
            if (!$names)
                return null;

            $preferred = [
                'models/gemini-1.5-flash',
                'models/gemini-1.5-pro',
                'models/gemini-1.0-pro',
                'models/gemini-pro',
            ];

            foreach ($preferred as $pref) {
                if (in_array($pref, $names, true)) {
                    return str_replace('models/', '', $pref);
                }
            }

            return str_replace('models/', '', $names[0]);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function verifyOption(): bool|string
    {
        $verify = config('services.gemini.verify', true);
        $caBundle = config('services.gemini.ca_bundle');

        if ($caBundle && file_exists($caBundle)) {
            return $caBundle;
        }

        // allow explicit opt-out via env GEMINI_VERIFY_SSL=false
        if (is_string($verify)) {
            $verify = filter_var($verify, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($verify === null) {
                $verify = true;
            }
        }

        return (bool) $verify;
    }
    private function buildStoreContext(): string
    {
        $lines = [];

        try {
            $productCount = Product::where('is_active', true)->count();
            $categoryCount = Category::where('is_active', true)->count();
            $brandCount = Brand::where('is_active', true)->count();

            if ($productCount)
                $lines[] = "Products available: {$productCount}.";
            if ($categoryCount)
                $lines[] = "Categories: {$categoryCount}.";
            if ($brandCount)
                $lines[] = "Brands: {$brandCount}.";

            $categories = Category::where('is_active', true)
                ->orderBy('sort_order')
                ->limit(8)
                ->pluck('name')
                ->filter()
                ->values();
            if ($categories->count()) {
                $lines[] = "Top categories: " . $categories->implode(', ') . ".";
            }

            $brands = Brand::where('is_active', true)
                ->orderBy('sort_order')
                ->limit(8)
                ->pluck('name')
                ->filter()
                ->values();
            if ($brands->count()) {
                $lines[] = "Top brands: " . $brands->implode(', ') . ".";
            }

            $latestProducts = Product::where('is_active', true)
                ->orderByDesc('created_at')
                ->limit(5)
                ->get(['name', 'price']);
            if ($latestProducts->count()) {
                $items = $latestProducts
                    ->map(fn($p) => $p->name . " ($" . number_format((float) $p->price, 2) . ")")
                    ->implode(', ');
                $lines[] = "New arrivals: {$items}.";
            }

            $contactEmail = Setting::where('key', 'footer_contact_email')->first()?->value;
            $contactPhone = Setting::where('key', 'footer_contact_phone')->first()?->value;
            if ($contactEmail || $contactPhone) {
                $contact = trim(($contactEmail ? "Email: {$contactEmail}." : '') . ' ' . ($contactPhone ? "Phone: {$contactPhone}." : ''));
                $lines[] = "Support contact: {$contact}";
            }
        } catch (\Throwable $e) {
            // avoid breaking chatbot on context errors
        }

        if (!$lines)
            return '';
        return "Store context: " . implode(' ', $lines);
    }

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

    public function settings()
    {
        $row = \App\Models\Setting::where('key', 'chatbot')->first();
        $value = is_array($row?->value) ? $row->value : [];

        return response()->json([
            'data' => array_merge($this->defaults(), $value),
        ]);
    }

    public function message(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:2000',
            'history' => 'sometimes|array',
            'history.*.role' => 'required_with:history|string',
            'history.*.content' => 'required_with:history|string',
        ]);

        $apiKey = config('services.gemini.api_key');
        $model = config('services.gemini.model', 'gemini-1.0-pro');
        $verifyOption = $this->verifyOption();

        if (!$apiKey) {
            return response()->json([
                'error' => 'Gemini API key not configured.',
            ], 500);
        }

        $contents = [];
        $history = $validated['history'] ?? [];
        foreach ($history as $item) {
            $role = $item['role'] === 'assistant' ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => [
                    ['text' => $item['content']],
                ],
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [
                ['text' => $validated['message']],
            ],
        ];

        $context = $this->buildStoreContext();
        $systemText = 'You are FitandSleek customer support assistant. Be friendly, concise, and helpful. Keep replies short and focus on store help, orders, shipping, returns, sizing, and product suggestions. If the user writes in Khmer, respond in Khmer. Otherwise respond in English.';
        if ($context) {
            $systemText .= "\n" . $context;
        }

        $payload = [
            'systemInstruction' => [
                'parts' => [
                    ['text' => $systemText],
                ],
            ],
            'contents' => $contents,
            'generationConfig' => [
                'temperature' => 0.6,
                'maxOutputTokens' => 400,
            ],
        ];

        /** @var callable(string): Response $callModel */
        $callModel = function (string $modelName) use ($apiKey, $payload, $verifyOption): Response {
            $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent";
            /** @var Response $resp */
            $resp = Http::timeout(15)
                ->withOptions(['verify' => $verifyOption])
                ->withQueryParameters(['key' => $apiKey])
                ->post($url, $payload);
            return $resp;
        };

        /** @var Response $response */
        $response = $callModel($model);

        if ($response->status() === 404) {
            $fallbacks = ['gemini-1.0-pro', 'gemini-pro'];
            foreach ($fallbacks as $fallback) {
                if ($fallback === $model)
                    continue;
                $response = $callModel($fallback);
                if ($response->status() >= 200 && $response->status() < 300) {
                    break;
                }
            }

            if ($response->status() === 404) {
                $available = $this->fetchAvailableModel($apiKey);
                if ($available) {
                    $response = $callModel($available);
                }
            }
        }

        if ($response->status() < 200 || $response->status() >= 300) {
            $details = json_decode($response->body(), true) ?: null;
            return response()->json([
                'error' => 'Chatbot request failed.',
                'details' => $details,
            ], 500);
        }

        $data = json_decode($response->body(), true) ?: [];
        $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if (!$text) {
            return response()->json([
                'error' => 'No response from chatbot.',
            ], 500);
        }

        return response()->json([
            'reply' => $text,
        ]);
    }
}
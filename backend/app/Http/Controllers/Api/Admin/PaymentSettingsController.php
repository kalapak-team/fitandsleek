<?php

namespace App\Http\Controllers\Api\Admin;

use Illuminate\Routing\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class PaymentSettingsController extends Controller
{
    // Only superadmin can access
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if ($request->user()->role !== 'superadmin') {
                return response()->json(['message' => 'Only superadmin can manage payment settings'], 403);
            }
            return $next($request);
        });
    }

    /**
     * Get all payment settings
     */
    public function index()
    {
        $settings = Setting::where('group', 'payment')->get()->keyBy('key');

        return response()->json([
            'bakong' => [
                'receive_account' => $settings['bakong_receive_account']?->value ?? '',
                'merchant_name' => $settings['bakong_merchant_name']?->value ?? '',
                'merchant_city' => $settings['bakong_merchant_city']?->value ?? '',
            ],
            'card' => [
                'provider' => $settings['card_provider']?->value ?? 'demo',
                'stripe_key' => $settings['stripe_key']?->value ?? '',
                'stripe_secret' => $settings['stripe_secret']?->value ?? '',
                'square_app_id' => $settings['square_app_id']?->value ?? '',
                'square_access_token' => $settings['square_access_token']?->value ?? '',
            ],
            'enabled_methods' => [
                'bakong_khqr' => (bool)($settings['payment_method_bakong_khqr']?->value ?? true),
                'card_visa' => (bool)($settings['payment_method_card_visa']?->value ?? true),
            ],
        ]);
    }

    /**
     * Update payment settings
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'bakong.receive_account' => 'nullable|string',
            'bakong.merchant_name' => 'nullable|string',
            'bakong.merchant_city' => 'nullable|string',
            'card.provider' => 'nullable|string|in:demo,stripe,square',
            'card.stripe_key' => 'nullable|string',
            'card.stripe_secret' => 'nullable|string',
            'card.square_app_id' => 'nullable|string',
            'card.square_access_token' => 'nullable|string',
            'enabled_methods.bakong_khqr' => 'nullable|boolean',
            'enabled_methods.card_visa' => 'nullable|boolean',
        ]);

        // Save Bakong settings
        if (isset($validated['bakong'])) {
            foreach ($validated['bakong'] as $key => $value) {
                $this->saveSetting('bakong_' . $key, $value, 'payment');
            }
        }

        // Save Card settings
        if (isset($validated['card'])) {
            foreach ($validated['card'] as $key => $value) {
                $this->saveSetting('card_' . $key, $value, 'payment');
            }
        }

        // Save enabled methods
        if (isset($validated['enabled_methods'])) {
            foreach ($validated['enabled_methods'] as $key => $value) {
                $this->saveSetting('payment_method_' . $key, $value, 'payment');
            }
        }

        return response()->json([
            'message' => 'Payment settings updated successfully',
            'settings' => $this->index()->getData(),
        ]);
    }

    /**
     * Helper to save settings
     */
    private function saveSetting($key, $value, $group = 'general')
    {
        Setting::updateOrCreate(
            ['key' => $key, 'group' => $group],
            ['value' => $value]
        );
    }
}

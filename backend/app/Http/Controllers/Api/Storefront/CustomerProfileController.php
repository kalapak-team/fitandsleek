<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CustomerProfileController extends Controller
{
    private function buildLegacyAddressFromGranular(array $payload): array
    {
        $streetParts = array_filter([
            !empty($payload['house_no']) ? 'House No. ' . $payload['house_no'] : null,
            !empty($payload['street_no']) ? 'Street ' . $payload['street_no'] : null,
            $payload['landmark'] ?? null,
        ]);

        return [
            'street' => implode(', ', $streetParts),
            'city' => $payload['sangkat'] ?? null,
            'state' => $payload['khan'] ?? null,
            'country' => $payload['province'] ?? null,
            'zip' => $payload['zip'] ?? null,
        ];
    }

    /**
     * Get user profile
     */
    public function getProfile()
    {
        return response()->json(auth()->user());
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . auth()->id(),
            'phone' => 'nullable|string|max:20',
        ]);

        $user = auth()->user();
        $user->update($request->only(['name', 'email', 'phone']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
        ]);
    }

    /**
     * Upload profile image
     */
    public function uploadProfileImage(Request $request)
    {
        $request->validate([
            'profile_image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        $user = auth()->user();

        // Delete old image if exists
        if ($user->profile_image_path && Storage::disk('public')->exists($user->profile_image_path)) {
            Storage::disk('public')->delete($user->profile_image_path);
        }

        // Store new image
        $file = $request->file('profile_image');
        $filename = 'profile_' . $user->id . '_' . time() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('profile_images', $filename, 'public');

        // Update user
        $user->update(['profile_image_path' => $path]);

        return response()->json([
            'message' => 'Profile image uploaded successfully',
            'profile_image_path' => $path,
            'profile_image_url' => asset('storage/' . $path),
        ]);
    }

    /**
     * Get user's orders
     */
    public function getOrders(Request $request)
    {
        $orders = Order::where('user_id', auth()->id())
            ->with(['items.product'])
            ->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10));

        return response()->json($orders);
    }

    /**
     * Get user's addresses
     */
    public function getAddresses()
    {
        $addresses = Address::where('user_id', auth()->id())
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();

        return response()->json([
            'data' => $addresses,
        ]);
    }

    /**
     * Add new address
     */
    public function addAddress(Request $request)
    {
        $request->validate([
            'label' => 'required|string|max:50',
            'receiver_name' => 'nullable|string|max:120',
            'receiver_phone' => 'nullable|string|max:30',
            'house_no' => 'required|string|max:50',
            'street_no' => 'required|string|max:120',
            'sangkat' => 'required|string|max:120',
            'khan' => 'required|string|max:120',
            'province' => 'required|string|max:120',
            'landmark' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_default' => 'nullable|boolean',
        ]);

        $hasAddresses = Address::where('user_id', auth()->id())->exists();
        $makeDefault = $request->boolean('is_default') || ! $hasAddresses;

        if ($makeDefault) {
            Address::where('user_id', auth()->id())->update(['is_default' => false]);
        }

        $legacy = $this->buildLegacyAddressFromGranular($request->all());

        $address = Address::create([
            'user_id' => auth()->id(),
            'label' => $request->input('label'),
            'receiver_name' => $request->input('receiver_name'),
            'receiver_phone' => $request->input('receiver_phone'),
            'house_no' => $request->input('house_no'),
            'street_no' => $request->input('street_no'),
            'sangkat' => $request->input('sangkat'),
            'khan' => $request->input('khan'),
            'province' => $request->input('province'),
            'landmark' => $request->input('landmark'),
            'street' => $request->input('street') ?: ($legacy['street'] ?? null),
            'city' => $request->input('city') ?: ($legacy['city'] ?? null),
            'state' => $request->input('state') ?: ($legacy['state'] ?? null),
            'zip' => $request->input('zip') ?: ($legacy['zip'] ?? null),
            'country' => $request->input('country') ?: ($legacy['country'] ?? null),
            'latitude' => $request->input('latitude'),
            'longitude' => $request->input('longitude'),
            'is_default' => $makeDefault,
        ]);

        return response()->json([
            'message' => 'Address added successfully',
            'address' => $address,
        ]);
    }

    /**
     * Update address
     */
    public function updateAddress(Request $request, $id)
    {
        $address = Address::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $request->validate([
            'label' => 'string|max:50',
            'receiver_name' => 'nullable|string|max:120',
            'receiver_phone' => 'nullable|string|max:30',
            'house_no' => 'sometimes|required|string|max:50',
            'street_no' => 'sometimes|required|string|max:120',
            'sangkat' => 'sometimes|required|string|max:120',
            'khan' => 'sometimes|required|string|max:120',
            'province' => 'sometimes|required|string|max:120',
            'landmark' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'zip' => 'nullable|string|max:20',
            'country' => 'nullable|string|max:100',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'is_default' => 'nullable|boolean',
        ]);

        // If setting as default, unset others
        if ($request->boolean('is_default')) {
            Address::where('user_id', auth()->id())
                ->where('id', '!=', $id)
                ->update(['is_default' => false]);
        }

        $payload = $request->only([
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
        ]);

        if (
            array_key_exists('house_no', $payload)
            || array_key_exists('street_no', $payload)
            || array_key_exists('sangkat', $payload)
            || array_key_exists('khan', $payload)
            || array_key_exists('province', $payload)
            || array_key_exists('landmark', $payload)
        ) {
            $source = [
                'house_no' => $payload['house_no'] ?? $address->house_no,
                'street_no' => $payload['street_no'] ?? $address->street_no,
                'sangkat' => $payload['sangkat'] ?? $address->sangkat,
                'khan' => $payload['khan'] ?? $address->khan,
                'province' => $payload['province'] ?? $address->province,
                'landmark' => $payload['landmark'] ?? $address->landmark,
                'zip' => $payload['zip'] ?? $address->zip,
            ];
            $legacy = $this->buildLegacyAddressFromGranular($source);
            if (!array_key_exists('street', $payload)) {
                $payload['street'] = $legacy['street'];
            }
            if (!array_key_exists('city', $payload)) {
                $payload['city'] = $legacy['city'];
            }
            if (!array_key_exists('state', $payload)) {
                $payload['state'] = $legacy['state'];
            }
            if (!array_key_exists('country', $payload)) {
                $payload['country'] = $legacy['country'];
            }
            if (!array_key_exists('zip', $payload)) {
                $payload['zip'] = $legacy['zip'];
            }
        }

        $address->update($payload);

        return response()->json([
            'message' => 'Address updated successfully',
            'address' => $address,
        ]);
    }

    /**
     * Delete address
     */
    public function deleteAddress($id)
    {
        $address = Address::where('user_id', auth()->id())
            ->where('id', $id)
            ->firstOrFail();

        $wasDefault = (bool) $address->is_default;

        $address->delete();

        if ($wasDefault) {
            $nextDefault = Address::where('user_id', auth()->id())
                ->orderByDesc('updated_at')
                ->first();

            if ($nextDefault) {
                $nextDefault->update(['is_default' => true]);
            }
        }

        return response()->json([
            'message' => 'Address deleted successfully',
        ]);
    }

    /**
     * Get user's wishlist
     */
    public function getWishlist()
    {
        $wishlist = auth()->user()->wishlist()
            ->with('category')
            ->get();

        return response()->json([
            'data' => $wishlist,
            'count' => $wishlist->count(),
        ]);
    }

    /**
     * Get user activity/history
     */
    public function getActivity(Request $request)
    {
        $activity = Order::where('user_id', auth()->id())
            ->select('id', 'status', 'total', 'created_at')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get()
            ->map(function ($order) {
                return [
                    'type' => 'order',
                    'title' => 'Order #' . $order->id,
                    'description' => 'Status: ' . ucfirst($order->status),
                    'amount' => $order->total,
                    'date' => $order->created_at,
                ];
            });

        return response()->json([
            'data' => $activity,
        ]);
    }
}

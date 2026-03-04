<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShipmentTrackingEvent;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DriverAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->where('role', 'driver')
            ->withCount('shipmentTrackingEvents')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $drivers = $query->paginate((int) $request->input('per_page', 15));

        return response()->json([
            'message' => 'Drivers retrieved successfully',
            'data' => $drivers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ]);

        $path = null;
        if ($request->hasFile('profile_image')) {
            $path = $request->file('profile_image')->store('profile-images', 'public');
        }

        $driver = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'driver',
            'status' => $validated['status'] ?? 'active',
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'profile_image_path' => $path,
            'profile_image_updated_at' => $path ? now() : null,
        ]);

        return response()->json([
            'message' => 'Driver created successfully',
            'data' => $driver,
        ], 201);
    }

    public function update(Request $request, User $driver): JsonResponse
    {
        if ($driver->role !== 'driver') {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($driver->id)],
            'phone' => ['nullable', 'string', 'max:30'],
            'address' => ['nullable', 'string', 'max:1000'],
            'status' => ['nullable', Rule::in(['active', 'inactive', 'suspended'])],
            'password' => ['nullable', 'string', 'min:8'],
            'profile_image' => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
        ]);

        if ($request->hasFile('profile_image')) {
            if ($driver->profile_image_path && Storage::disk('public')->exists($driver->profile_image_path)) {
                Storage::disk('public')->delete($driver->profile_image_path);
            }
            $newPath = $request->file('profile_image')->store('profile-images', 'public');
            $validated['profile_image_path'] = $newPath;
            $validated['profile_image_updated_at'] = now();
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $driver->update($validated);

        return response()->json([
            'message' => 'Driver updated successfully',
            'data' => $driver->fresh(),
        ]);
    }

    public function scans(Request $request, User $driver): JsonResponse
    {
        if ($driver->role !== 'driver') {
            return response()->json(['message' => 'Driver not found'], 404);
        }

        $events = ShipmentTrackingEvent::with(['shipment.order'])
            ->where('updated_by', $driver->id)
            ->orderByDesc('event_time')
            ->paginate((int) $request->input('per_page', 20));

        return response()->json([
            'message' => 'Driver scan history retrieved successfully',
            'data' => $events,
        ]);
    }
}

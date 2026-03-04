<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class CustomerAdminController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with(['orders'])
            ->where('role', 'customer')
            ->orderByDesc('id');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                  ->orWhere('email', 'ilike', "%{$search}%")
                  ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        $customers = $query->paginate($request->input('per_page', 15));

        // Transform to include order count and total spent
        $customers->through(function ($customer) {
            $customer->orders_count = $customer->orders()->count();
            $customer->total_spent = $customer->orders()->sum('total');
            return $customer;
        });

        return response()->json($customers);
    }

    public function show(User $customer)
    {
        return response()->json($customer);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        // Determine role based on request (default: customer)
        $role = $request->input('role', 'customer');
        if (!in_array($role, ['customer', 'admin'])) {
            $role = 'customer';
        }

        // Only superadmin can create admin users
        $currentUser = Auth::user();
        if ($role === 'admin' && $currentUser?->role !== 'superadmin') {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to create admin users'
            ], 403);
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'address' => $validated['address'] ?? null,
            'role' => $role,
            'is_active' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => ucfirst($role) . ' created successfully',
            'data' => $user,
        ], 201);
    }

    public function update(\Illuminate\Http\Request $request, User $customer)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($customer->id)],
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:500',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $customer,
        ]);
    }

    public function destroy(User $customer)
    {
        $currentUser = Auth::user();
        $currentUserId = Auth::id();

        // Prevent deleting yourself
        if ($customer->id === $currentUserId) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 403);
        }

        // Only superadmin can delete admin users
        if ($customer->role === 'admin' && $currentUser?->role !== 'superadmin') {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to delete admin users'
            ], 403);
        }

        $customer->delete();

        return response()->json([
            'success' => true,
            'message' => 'User deleted successfully',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;

class AdminSearchController extends Controller
{
    /**
     * Search across products, orders, and customers
     */
    public function search(Request $request)
    {
        $query = $request->get('q', '');
        
        if (empty($query)) {
            return response()->json([
                'products' => [],
                'orders' => [],
                'customers' => [],
            ]);
        }
        
        // Search products (case-insensitive + typo tolerance)
        $products = Product::where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('sku', 'LIKE', "%{$query}%");
                
                // Add fuzzy matching for longer queries
                if (strlen($query) >= 4) {
                    for ($i = 0; $i < strlen($query) - 1; $i++) {
                        $pattern = substr($query, 0, $i) . substr($query, $i + 1);
                        $q->orWhere('name', 'LIKE', "%{$pattern}%");
                    }
                }
            })
            ->limit(5)
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'type' => 'product',
                    'price' => $product->price,
                    'category' => 'Product',
                ];
            });
        
        // Search orders
        $orders = Order::where('id', 'like', "%{$query}%")
            ->orWhereHas('user', function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->with('user')
            ->limit(5)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'name' => $order->user->name ?? 'Guest',
                    'total' => $order->total,
                    'status' => $order->status,
                    'type' => 'order',
                    'category' => 'Order',
                ];
            });
        
        // Search customers
        $customers = User::where('role', 'customer')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'type' => 'customer',
                    'category' => 'Customer',
                ];
            });
        
        return response()->json([
            'products' => $products,
            'orders' => $orders,
            'customers' => $customers,
        ]);
    }
}


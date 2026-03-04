<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class AdminNotificationController extends Controller
{
    protected $cacheKey = 'admin_notifications';
    
    /**
     * Get admin notifications with caching
     */
    public function index(Request $request)
    {
        $limit = $request->get('limit', 10);
        
        // Try to get from cache first
        $cached = Cache::get($this->cacheKey);
        if ($cached) {
            $notifications = $cached;
        } else {
            $notifications = $this->buildNotifications();
            Cache::put($this->cacheKey, $notifications, now()->addMinutes(5));
        }
        
        // Sort by time (newest first) and limit
        $notifications = collect($notifications)
            ->sortByDesc('timestamp')
            ->take($limit)
            ->values()
            ->all();
        
        $unreadCount = count(array_filter($notifications, function($n) { return !$n['read']; }));
        
        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }
    
    /**
     * Build notifications from various sources
     */
    protected function buildNotifications()
    {
        $notifications = [];
        
        // New orders (last 7 days)
        $recentOrders = Order::where('created_at', '>=', now()->subDays(7))
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();
        
        foreach ($recentOrders as $order) {
            $notifications[] = [
                'id' => 'order-' . $order->id,
                'type' => 'order',
                'message' => "New order #{$order->id} from {$order->user->name}",
                'time' => $order->created_at->diffForHumans(),
                'timestamp' => $order->created_at->timestamp,
                'read' => false,
                'link' => "/admin/orders?id={$order->id}",
            ];
        }
        
        // Low stock products
        $lowStockProducts = Product::where('stock', '<', 10)
            ->orderBy('stock', 'asc')
            ->limit(3)
            ->get();
        
        foreach ($lowStockProducts as $product) {
            $notifications[] = [
                'id' => 'stock-' . $product->id,
                'type' => 'stock',
                'message' => "Low stock: {$product->name} ({$product->stock} left)",
                'time' => $product->updated_at->diffForHumans(),
                'timestamp' => $product->updated_at->timestamp,
                'read' => false,
                'link' => "/admin/products?id={$product->id}",
            ];
        }
        
        // New customers (last 24 hours)
        $newCustomers = User::where('role', 'customer')
            ->where('created_at', '>=', now()->subHours(24))
            ->limit(3)
            ->get();
        
        foreach ($newCustomers as $customer) {
            $notifications[] = [
                'id' => 'customer-' . $customer->id,
                'type' => 'customer',
                'message' => "New customer registered: {$customer->name}",
                'time' => $customer->created_at->diffForHumans(),
                'timestamp' => $customer->created_at->timestamp,
                'read' => false,
                'link' => "/admin/customers?id={$customer->id}",
            ];
        }
        
        return $notifications;
    }
    
    /**
     * Mark a single notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        // In a real app, you'd update a notifications table
        // For now, we'll just return success
        return response()->json([
            'success' => true,
            'message' => 'Notification marked as read',
        ]);
    }
    
    /**
     * Mark all notifications as read
     */
    public function markAllRead()
    {
        // In a real app, you'd update a notifications table
        Cache::put($this->cacheKey, [], now()->addDays(7));
        
        return response()->json([
            'success' => true,
            'message' => 'All notifications marked as read',
        ]);
    }
    
    /**
     * Delete a notification
     */
    public function destroy(Request $request, $id)
    {
        // In a real app, you'd delete from a notifications table
        return response()->json([
            'success' => true,
            'message' => 'Notification deleted',
        ]);
    }
}


<?php

namespace App\Http\Controllers\Api\Storefront;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    /**
     * Get user notifications and messages.
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        $isGuest = !$user;

        // Get user notifications (only for authenticated users)
        $notifications = collect();
        $totalUnreadNotifications = 0;

        if ($user) {
            $notifications = Notification::forUser($user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($notification) {
                    return [
                        'id' => 'notification-' . $notification->id,
                        'type' => 'notification',
                        'title' => $notification->title,
                        'message' => $notification->message,
                        'data' => $notification->data,
                        'is_read' => $notification->is_read,
                        'created_at' => $notification->created_at,
                    ];
                });

            $totalUnreadNotifications = Notification::forUser($user->id)->unread()->count();
        }

        // Get active messages for this user/guest
        $userLanguage = $request->header('Accept-Language', 'en');
        $userLanguage = in_array($userLanguage, ['en', 'km']) ? $userLanguage : 'en';

        // Determine audience: guests for unauthenticated, or based on user role
        $audience = $isGuest ? 'guests' : ($user->role === 'customer' ? 'customers' : 'guests');

        $messages = Message::active()
            ->byLanguage($userLanguage)
            ->where(function ($query) use ($audience) {
                $query->where('target_audience', 'all')
                      ->orWhere('target_audience', $audience);
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => 'message-' . $message->id,
                    'type' => 'message',
                    'title' => $message->title,
                    'message' => $message->content,
                    'link_url' => $message->link_url,
                    'media_url' => $message->media_url,
                    'media_type' => $message->media_type,
                    'language' => $message->language,
                    'target_audience' => $message->target_audience,
                    'is_read' => false, // Messages don't have read status
                    'created_at' => $message->created_at,
                ];
            });

        $messageCount = $messages->count();

        // Combine and sort by creation date
        $allItems = collect([...$notifications, ...$messages])
            ->sortByDesc('created_at')
            ->values();

        // Paginate the combined results
        $perPage = $request->per_page ?? 20;
        $page = $request->page ?? 1;
        $paginatedItems = $allItems->forPage($page, $perPage);

        return response()->json([
            'notifications' => [
                'data' => $paginatedItems,
                'current_page' => $page,
                'per_page' => $perPage,
                'total' => $allItems->count(),
                'last_page' => ceil($allItems->count() / $perPage),
            ],
            'unread_count' => $totalUnreadNotifications + $messageCount,
        ]);
    }

    /**
     * Get unread notification count.
     */
    public function unreadCount()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $count = Notification::forUser($user->id)->unread()->count();

        return response()->json(['unread_count' => $count]);
    }

    /**
     * Mark a notification as read.
     */
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = Notification::forUser($user->id)->find($id);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllAsRead()
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        Notification::forUser($user->id)->unread()->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    /**
     * Delete a notification.
     */
    public function destroy($id)
    {
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $notification = Notification::forUser($user->id)->find($id);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->delete();

        return response()->json(['success' => true]);
    }
}


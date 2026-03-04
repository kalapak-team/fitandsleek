import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { useNotifications } from '../state/notifications.jsx';
import { useLanguage } from '../lib/i18n.jsx';
import { useAuth } from '../state/auth.jsx';

export default function UserNotifications() {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification 
  } = useNotifications();
  const { t } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('justNow');
    if (diffMins < 60) return `${diffMins}${t('minutesAgo')}`;
    if (diffHours < 24) return `${diffHours}${t('hoursAgo')}`;
    if (diffDays < 7) return `${diffDays}${t('daysAgo')}`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'promotion':
        return '🏷️';
      case 'system':
        return '🔔';
      case 'message':
        return '💬';
      default:
        return '📌';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="container-safe py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{t('notifications')}</h1>
            {user && unreadCount > 0 && (
              <p className="text-sm text-zinc-500 mt-1">
                {unreadCount} {unreadCount > 1 ? t('unreadNotifications') : t('unreadNotification')}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchNotifications}
              className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors"
              title={t('refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                {t('markAllRead')}
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                <p className="text-sm text-zinc-500">{t('loadingNotifications')}</p>
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-100">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-900 mb-1">
              {t('noNotifications')}
            </h3>
            <p className="text-sm text-zinc-500">
              {t('notifyImportant')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
            <div className="divide-y divide-zinc-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 transition-colors ${
                    notification.is_read 
                      ? 'bg-white' 
                      : 'bg-emerald-50/50'
                  } hover:bg-zinc-50`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className={`font-medium ${
                          notification.is_read 
                            ? 'text-zinc-700' 
                            : 'text-zinc-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-sm text-zinc-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-zinc-400 mt-2">
                          {formatDate(notification.created_at)}
                        </p>
                      </div>

                      {/* Actions - Only show for authenticated users and actual notifications (not messages) */}
                      {user && !notification.id.startsWith('message-') && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-emerald-600 transition-colors"
                              title={t('markAsRead')}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-red-600 transition-colors"
                            title={t('delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Unread indicator */}
                    {!notification.is_read && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-3" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


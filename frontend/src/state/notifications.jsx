import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications');
      setNotifications(response.data.notifications?.data || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await api.get('/notifications/unread-count', {
        headers: {
          'Accept-Language': localStorage.getItem('language') || 'en'
        }
      });
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // For guests, unread count is always 0 since they can't have unread notifications
      setUnreadCount(0);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await api.post('/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => {
        // Only mark actual notifications as read, not messages
        if (n.id.startsWith('message-')) {
          return n;
        }
        return { ...n, is_read: true };
      }));
      // Recalculate unread count based on actual notifications only
      const actualNotifications = notifications.filter(n => !n.id.startsWith('message-') && !n.is_read);
      setUnreadCount(Math.max(0, actualNotifications.length - 1));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, [notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (notification && !notification.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    try {
      // Only delete actual notifications, not messages
      const notificationIds = notifications
        .filter(n => !n.id.startsWith('message-'))
        .map(n => n.id);

      await Promise.all(
        notificationIds.map(id => api.delete(`/notifications/${id}`))
      );

      // Keep only messages
      setNotifications(prev => prev.filter(n => n.id.startsWith('message-')));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, [notifications]);

  return (
    <NotificationsContext.Provider 
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}


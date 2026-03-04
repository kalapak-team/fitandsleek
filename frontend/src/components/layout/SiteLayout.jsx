import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Topbar from "./Topbar.jsx";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";
import MobileBottomNav from "./MobileBottomNav.jsx";
import SupportChatWidget from "../widgets/SupportChatWidget.jsx";
import CartDrawer from "../shop/CartDrawer.jsx";
import NotificationDrawer from "./NotificationDrawer.jsx";
import ScrollToTop from "../ScrollToTop.jsx";
import api from "../../lib/api.js";
import { useAuth } from "../../state/auth.jsx";

export default function SiteLayout() {
  const [cartOpen, setCartOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsUnread, setNotificationsUnread] = useState(0);
  const { user } = useAuth();

  const loadNotifications = async () => {
    setNotificationsLoading(true);
    try {
      const endpoint = user ? "/notifications" : "/notifications/public";
      const { data } = await api.get(endpoint);
      const items = data?.notifications?.data || [];
      setNotifications(items);
      setNotificationsUnread(data?.unread_count || 0);
    } catch (err) {
      setNotifications([]);
      setNotificationsUnread(0);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const markNotificationRead = async (item) => {
    if (!user || item?.type !== "notification" || item?.is_read) return;
    const rawId = String(item.id || "").replace("notification-", "");
    if (!rawId) return;
    try {
      await api.patch(`/notifications/${rawId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setNotificationsUnread((v) => Math.max(0, v - 1));
    } catch {
      // ignore
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user) return;
    try {
      await api.post("/notifications/mark-all-read");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setNotificationsUnread(0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (notificationsOpen) {
      loadNotifications();
    }
  }, [notificationsOpen, user]);

  const formatNotifTime = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        notificationsUnread={notificationsUnread}
      />
      <main className="flex-1 fs-page-enter pb-28 sm:pb-24 lg:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav
        onOpenNotifications={() => setNotificationsOpen(true)}
        notificationsUnread={notificationsUnread}
        notifications={notifications}
        notificationsLoading={notificationsLoading}
        onMarkNotificationRead={markNotificationRead}
        onMarkAllNotificationsRead={markAllNotificationsRead}
        formatTime={formatNotifTime}
      />
      <SupportChatWidget />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <NotificationDrawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        loading={notificationsLoading}
        unreadCount={notificationsUnread}
        onMarkRead={markNotificationRead}
        onMarkAllRead={markAllNotificationsRead}
        user={user}
        formatTime={formatNotifTime}
      />
      <ScrollToTop />
    </div>
  );
}

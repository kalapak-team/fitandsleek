import React, { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Store, Bell, ShoppingBag, User, Heart } from "lucide-react";
import { useCart } from "../../state/cart.jsx";
import { useWishlist } from "../../state/wishlist.jsx";
import { useAuth } from "../../state/auth.jsx";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";
import NotificationDrawer from "./NotificationDrawer.jsx";

function Badge({ value }) {
  if (!value) return null;
  return (
    <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-zinc-900 text-white text-[10px] leading-[18px] text-center">
      {value}
    </span>
  );
}

function useActiveTab() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return {
    pathname: location.pathname,
    tab: params.get("tab") || "",
  };
}

export default function MobileBottomNav({
  onOpenNotifications = () => {},
  notificationsUnread = 0,
  notifications = [],
  notificationsLoading = false,
  onMarkNotificationRead = () => {},
  onMarkAllNotificationsRead = () => {},
  formatTime = () => "",
}) {
  const { count } = useCart();
  const wishlist = useWishlist();
  const { user } = useAuth();
  const { settings } = useHomepageSettings();
  const { pathname, tab } = useActiveTab();
  const [showNotifications, setShowNotifications] = useState(false);

  const showWishlist = settings?.header?.wishlist_enabled !== false;

  const items = useMemo(() => {
    const base = [
      { key: "home", label: "Home", to: "/", icon: Home, isLink: true },
      { key: "shop", label: "Shop", to: "/search?tab=categories", icon: Store, isLink: true },
      { key: "notifications", label: "Notifications", to: null, icon: Bell, isLink: false, badge: notificationsUnread, onClick: () => { setShowNotifications(true); onOpenNotifications(); } },
      { key: "cart", label: "Cart", to: "/cart", icon: ShoppingBag, isLink: true, badge: count },
    ];

    if (showWishlist) {
      base.push({ key: "wishlist", label: "Wishlist", to: "/search?tab=wishlist", icon: Heart, isLink: true, badge: wishlist.count });
    }

    base.push({ key: "account", label: user ? "Account" : "Login", to: user ? "/profile" : "/login", icon: User, isLink: true });
    return base;
  }, [count, showWishlist, wishlist.count, user, notificationsUnread, onOpenNotifications]);

  const isActive = (key) => {
    if (key === "home") return pathname === "/";
    if (key === "shop") return pathname === "/search" && tab === "categories";
    if (key === "notifications") return showNotifications;
    if (key === "cart") return pathname === "/cart";
    if (key === "wishlist") return pathname === "/search" && tab === "wishlist";
    if (key === "account") return pathname === "/profile" || pathname === "/login";
    return false;
  };

  return (
    <>
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/80" />
        <div className="pointer-events-none absolute inset-0 backdrop-blur-xl" />
        <div className="relative border-t border-zinc-200/70">
          <div className="container-safe">
            <div
              className="grid gap-1 py-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]"
              style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
            >
              {items.map((item) => {
                const active = isActive(item.key);
                const Icon = item.icon;
                const content = (
                  <>
                    <span
                      className={`relative flex h-9 w-9 items-center justify-center rounded-2xl border transition-all ${
                        active
                          ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                          : "bg-white border-zinc-200 text-zinc-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" strokeWidth={2} />
                      <Badge value={item.badge} />
                    </span>
                    <span className={active ? "text-zinc-900" : "text-zinc-500"}>{item.label}</span>
                  </>
                );

                if (item.isLink) {
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all ${
                        active
                          ? "text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                      aria-label={item.label}
                    >
                      {content}
                    </Link>
                  );
                } else {
                  return (
                    <button
                      key={item.key}
                      onClick={item.onClick}
                      className={`relative flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-semibold transition-all ${
                        active
                          ? "text-zinc-900"
                          : "text-zinc-500 hover:text-zinc-900"
                      }`}
                      aria-label={item.label}
                    >
                      {content}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Drawer */}
      <NotificationDrawer
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        loading={notificationsLoading}
        unreadCount={notificationsUnread}
        onMarkRead={onMarkNotificationRead}
        onMarkAllRead={onMarkAllNotificationsRead}
        formatTime={formatTime}
      />
    </>
  );
}
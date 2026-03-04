import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import api from "../../lib/api";
import { useTheme } from "../../state/theme.jsx";

export default function AdminTopbar() {
  const { user, logout } = useAuth();
  const { primaryColor, mode, saveTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const onDocClick = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setShowSearch(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setShowProfile(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      try {
        const { data } = await api.get("/admin/search", { params: { q: query } });
        const merged = [...(data.products || []), ...(data.orders || []), ...(data.customers || [])].slice(0, 6);
        setResults(merged);
      } catch {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!showNotif) return;
    (async () => {
      try {
        const { data } = await api.get("/admin/notifications");
        setNotifications(data.notifications || []);
        setUnreadCount(data.unread_count || 0);
      } catch {
        setNotifications([]);
      }
    })();
  }, [showNotif]);

  const markAllRead = async () => {
    try {
      await api.post("/admin/notifications/mark-all-read");
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // ignore silently
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="h-16 md:h-20 admin-surface border-b admin-border px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm md:text-base font-semibold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-[11px] md:text-xs text-slate-500 dark:text-slate-400">Enterprise control panel</p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="hidden sm:inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)] transition"
          title="Go to site"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          <span>Go to site</span>
        </button>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <div className="relative w-[300px] hidden md:block" ref={searchRef}>
          <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSearch(true);
            }}
            onFocus={() => setShowSearch(true)}
            placeholder="Search orders, products, customers..."
            className="h-11 w-full rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2"
            style={{
              borderColor: undefined,
              boxShadow: "none",
            }}
          />

          {showSearch && query && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              {results.length ? (
                results.map((item, idx) => (
                  <button
                    key={`${item.type}-${item.id}-${idx}`}
                    onClick={() => {
                      setShowSearch(false);
                      setQuery("");
                      if (item.type === "product") navigate("/admin/products");
                      else if (item.type === "order") navigate("/admin/orders");
                      else navigate("/admin/customers");
                    }}
                    className="w-full px-4 py-3 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition-colors"
                  >
                    {item.name || `#${item.id}`}
                  </button>
                ))
              ) : (
                <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">No results found.</p>
              )}
            </div>
          )}
        </div>

        {/* Dark / Light mode toggle */}
        <button
          onClick={() => saveTheme(mode === "dark" ? "light" : "dark", primaryColor)}
          title={mode === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="relative h-11 w-11 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)] transition flex items-center justify-center"
        >
          {mode === "dark" ? (
            /* Sun icon — shown in dark mode to switch to light */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v2m0 16v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M2 12h2m16 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            /* Moon icon — shown in light mode to switch to dark */
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotif((prev) => !prev);
              setShowProfile(false);
            }}
            className="relative h-11 w-11 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)] transition"
          >
            <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.7V5a2 2 0 10-4 0v.3A6 6 0 006 11v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Notifications</p>
                <button onClick={markAllRead} className="text-xs font-medium text-[var(--admin-primary)] hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length ? (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (n.link) navigate(n.link);
                        setShowNotif(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm border-b border-slate-50 dark:border-slate-700 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition-colors ${n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}
                    >
                      <p>{n.message}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{n.time}</p>
                    </button>
                  ))
                ) : (
                  <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">No notifications yet.</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            onClick={() => {
              setShowProfile((prev) => !prev);
              setShowNotif(false);
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 h-11 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition"
          >
            <div className="h-8 w-8 rounded-2xl text-white text-sm font-semibold flex items-center justify-center overflow-hidden" style={{ backgroundColor: primaryColor }}>
              {user?.profile_image_url ? (
                <img src={user.profile_image_url} alt={user?.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0)?.toUpperCase() || "A"
              )}
            </div>
            <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-200">Admin</span>
            <svg className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform ${showProfile ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
              <button
                onClick={() => {
                  navigate("/admin/profile");
                  setShowProfile(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition-colors"
              >
                My Profile
              </button>
              <button
                onClick={() => {
                  navigate("/admin/settings");
                  setShowProfile(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-slate-200 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition-colors"
              >
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

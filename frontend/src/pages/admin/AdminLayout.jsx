import React, { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../state/auth";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";
import AdminTopbar from "../../components/admin/AdminTopbar";
import Logo from "../../components/Logo.jsx";
import { useTheme } from "../../state/theme.jsx";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { settings, loading: settingsLoading } = useHomepageSettings();
  const { primaryColor, mode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({
    commerce: false,
    content: false,
    operations: false,
    users: false,
  });
  const logoSrc = settings?.header?.logo_url || "/logo.png";

  if (settingsLoading) {
    return (
      <div className="p-6">
        <AdminContentSkeleton lines={2} imageHeight={160} className="max-w-4xl mx-auto" />
      </div>
    );
  }

  const directItems = useMemo(
    () => [
      { path: "/admin", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", label: "Dashboard" },
      { path: "/admin/reports", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", label: "Reports" },
      { path: "/admin/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "My Profile" },
      { path: "/admin/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", label: "Settings" },
    ],
    []
  );

  const groupedItems = useMemo(
    () => [
      {
        key: "commerce",
        label: "Commerce",
        icon: "M4 6h16M4 12h16M4 18h16",
        children: [
          { path: "/admin/products", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", label: "Products" },
          { path: "/admin/sales", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Sales" },
          { path: "/admin/categories", icon: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z", label: "Categories" },
          { path: "/admin/brands", icon: "M7 4h10M7 8h10M7 12h10M7 16h10M7 20h10", label: "Brands" },
        ],
      },
      {
        key: "content",
        label: "Content",
        icon: "M4 4h16v16H4z",
        children: [
          { path: "/admin/homepage", icon: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Home Page" },
          { path: "/admin/homepage-complete", icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z", label: "Complete Manager" },
        ],
      },
      {
        key: "operations",
        label: "Operations",
        icon: "M9 17v-2m6 2v-6m5 6V7M4 17v-4",
        children: [
          { path: "/admin/orders", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", label: "Orders" },
          { path: "/admin/contacts", icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z", label: "Contacts" },
          { path: "/admin/messages", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", label: "Messages" },
          { path: "/admin/chatbot", icon: "M12 20h9M16.5 3a5.5 5.5 0 010 11H8l-4 4V8a5 5 0 015-5h7.5z", label: "Chatbot" },
          { path: "/admin/payments", icon: "M3 10a1 1 0 011-1h.01M3 20a1 1 0 011-1h.01M9 15a6 6 0 11-12 0 6 6 0 0112 0z", label: "Payments" },
          { path: "/admin/drivers", icon: "M9 19l3 3 3-3m-3 3v-6m-7-3a4 4 0 118 0v1H5v-1zm11 0a4 4 0 118 0v1h-8v-1z", label: "Drivers" },
          { path: "/admin/shipments", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4", label: "Shipments" },
          { path: "/admin/replacement-cases", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", label: "Replacements" },
          { path: "/admin/notifications", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9", label: "Notifications" },
        ],
      },
      {
        key: "users",
        label: "Users",
        icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
        children: [
          { path: "/admin/customers", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", label: "Customers" },
          { path: "/admin/administrators", icon: "M17 20h5l-1.405-1.405A2.032 2.032 0 0120 17.158V14a6.002 6.002 0 00-4-5.659V8a2 2 0 10-4 0v.341C10.67 9.165 9 11.388 9 14v3.159c0 .538-.214 1.055-.595 1.436L7 20h5", label: "Administrators" },
        ],
      },
    ],
    []
  );

  const allNavItems = useMemo(() => {
    const groupsFlat = groupedItems.flatMap((g) => g.children);
    return [...directItems, ...groupsFlat];
  }, [directItems, groupedItems]);

  const bottomNavPaths = ["/admin", "/admin/reports", "/admin/orders", "/admin/payments"];

  const activeBottomIndex = useMemo(() => {
    const idx = bottomNavPaths.findIndex((p) => location.pathname.startsWith(p));
    return idx >= 0 ? idx : 0;
  }, [location.pathname]);

  const bottomNavItems = useMemo(
    () =>
      bottomNavPaths
        .map((path) => allNavItems.find((item) => item.path === path))
        .filter(Boolean),
    [allNavItems]
  );

  const otherNavItems = useMemo(
    () => allNavItems.filter((item) => !bottomNavPaths.includes(item.path)),
    [allNavItems]
  );

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      groupedItems.forEach((group) => {
        if (group.children.some((child) => location.pathname.startsWith(child.path))) {
          next[group.key] = true;
        }
      });
      return next;
    });
  }, [groupedItems, location.pathname]);

  const toggleGroup = (groupKey) => {
    setOpenGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="admin-theme admin-root min-h-screen overflow-x-hidden text-slate-800 dark:text-slate-100 font-sans flex admin-soft">
      <aside
        className={`${sidebarOpen ? "w-72" : "w-20"} hidden md:block fixed left-0 top-0 h-screen admin-surface border-r admin-border transition-all duration-300 z-30 overflow-hidden`}
      >
        <div className="h-20 px-4 flex items-center justify-between border-b admin-border">
          <div className="overflow-hidden">
            <Logo className={sidebarOpen ? "h-16 w-auto" : "h-12 w-auto"} src={logoSrc} alt="Fit&Sleek" />
          </div>
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="h-10 w-10 rounded-2xl admin-surface border admin-border text-slate-500 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition"
          >
            <svg className={`w-5 h-5 mx-auto transition-transform ${sidebarOpen ? "" : "rotate-180"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="p-3 h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
          <ul className="space-y-1.5">
            {directItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === "/admin"}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent border-l-2 transition-all duration-200 ${
                      isActive
                        ? "text-white shadow-sm border-l-emerald-500"
                        : "text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)] dark:hover:bg-slate-800 dark:hover:text-white"
                    }`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : primaryColor,
                          color: mode === "dark" ? "#ffffff" : "#0b0b0f",
                        }
                      : undefined
                  }
                >
                  <svg className={`w-5 h-5 shrink-0 ${sidebarOpen ? "" : "mx-auto"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                  </svg>
                  {sidebarOpen && <span className="text-sm font-medium truncate">{item.label}</span>}
                </NavLink>
              </li>
            ))}

            {groupedItems.map((group) => {
              const groupHasActive = group.children.some((child) => location.pathname.startsWith(child.path));
              const isOpen = !!openGroups[group.key] && sidebarOpen;

              return (
                <li key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent border-l-2 transition-all duration-200 ${
                      groupHasActive
                        ? "text-[var(--admin-primary)] bg-[rgba(var(--admin-primary-rgb),0.12)] border-l-emerald-500 dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)] dark:hover:bg-slate-800 dark:hover:text-white"
                    }`}
                  >
                    <svg className={`w-5 h-5 shrink-0 ${sidebarOpen ? "" : "mx-auto"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={group.icon} />
                    </svg>
                    {sidebarOpen && (
                      <>
                        <span className="text-sm font-medium truncate flex-1 text-left">{group.label}</span>
                        <svg
                          className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </>
                    )}
                  </button>

                  {sidebarOpen && (
                    <div
                      className="overflow-hidden transition-all duration-300 ease-in-out"
                      style={{
                        maxHeight: isOpen ? `${group.children.length * 52}px` : "0px",
                        opacity: isOpen ? 1 : 0,
                      }}
                    >
                      <ul className="mt-1 space-y-1 pl-2">
                        {group.children.map((item) => (
                          <li key={item.path}>
                            <NavLink
                              to={item.path}
                              className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-2.5 rounded-xl border border-transparent border-l-2 text-sm transition-all duration-200 ${
                                  isActive
                                    ? "text-white shadow-sm border-l-emerald-500"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)]"
                                }`
                              }
                              style={({ isActive }) =>
                                isActive
                                  ? {
                                      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.06)" : primaryColor,
                                      color: mode === "dark" ? "#ffffff" : "#0b0b0f",
                                    }
                                  : undefined
                              }
                            >
                              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                              </svg>
                              <span className="truncate">{item.label}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {sidebarOpen && (
            <div className="mt-5 rounded-2xl border admin-border admin-surface p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl text-white font-semibold flex items-center justify-center overflow-hidden" style={{ backgroundColor: primaryColor }}>
                  {user?.profile_image_url ? (
                    <img src={user.profile_image_url} alt={user?.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || "A"
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name || "Admin"}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="mt-3 w-full h-10 rounded-2xl border admin-border admin-surface text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:text-[var(--admin-primary)] transition"
              >
                Logout
              </button>
            </div>
          )}
        </nav>
      </aside>

      <main className={`${sidebarOpen ? "md:ml-72" : "md:ml-20"} ml-0 flex-1 min-w-0 transition-all duration-300 admin-soft min-h-screen flex flex-col`}>
        {/* Mobile header with overflow menu */}
        <div className="md:hidden sticky top-0 z-40 flex items-center gap-3 admin-surface backdrop-blur px-4 py-3 border-b admin-border">
          <Logo className="h-10 w-auto flex-shrink-0" src={logoSrc} alt="Fit&Sleek" />
          <div className="flex-1">
            <div className="relative">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="search"
                placeholder="Search..."
                className="h-10 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[rgba(var(--admin-primary-rgb),0.25)]"
              />
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="h-10 w-10 rounded-xl border admin-border admin-surface text-slate-600 dark:text-slate-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <AdminTopbar />
        <div className="p-4 md:p-8 pb-24 md:pb-8 admin-soft text-[15px] leading-relaxed md:text-base">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom navigation (flat style) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t admin-border admin-surface backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.18)]"
      >
        <div
          className="grid gap-2 px-3 py-3"
          style={{ gridTemplateColumns: `repeat(${bottomNavItems.length || 1}, minmax(0, 1fr))` }}
        >
          {bottomNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/admin"}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-2 text-[11px] font-semibold transition-colors duration-200 ${
                  isActive
                    ? "text-[var(--admin-primary)] dark:text-white"
                    : "text-slate-700 dark:text-white/90 hover:text-slate-900 dark:hover:text-white"
                }`
              }
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/8 backdrop-blur-sm ${
                  location.pathname.startsWith(item.path)
                    ? "bg-[rgba(var(--admin-primary-rgb),0.14)] text-[var(--admin-primary)] dark:bg-white/12 dark:text-white"
                    : "bg-white/80 dark:bg-slate-800/80 dark:text-white"
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </span>
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile overflow menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 admin-surface border-l admin-border shadow-2xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Menu</h3>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="h-10 w-10 rounded-xl border admin-border admin-surface text-slate-600 dark:text-slate-200 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <ul className="space-y-2">
              {otherNavItems.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        isActive ? "text-[var(--admin-primary)] bg-[rgba(var(--admin-primary-rgb),0.12)]" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`
                    }
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

    </div>
  );
}

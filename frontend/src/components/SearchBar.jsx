import React, { useState, useEffect } from "react";
import {
  Search,
  LayoutDashboard,
  BarChart3,
  Package,
  BadgePercent,
  Tags,
  Building2,
  Home,
  LayoutGrid,
  ClipboardList,
  Users,
  Mail,
  MessageCircle,
  Bell,
  User,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { path: "/admin/reports", label: "Reports", icon: BarChart3 },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/sales", label: "Sales", icon: BadgePercent },
  { path: "/admin/categories", label: "Categories", icon: Tags },
  { path: "/admin/brands", label: "Brands", icon: Building2 },
  { path: "/admin/homepage", label: "Home Page", icon: Home },
  { path: "/admin/homepage-complete", label: "Homepage Manager", icon: LayoutGrid },
  { path: "/admin/orders", label: "Orders", icon: ClipboardList },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/administrators", label: "Administrators", icon: Users },
  { path: "/admin/contacts", label: "Contacts", icon: Mail },
  { path: "/admin/messages", label: "Messages", icon: MessageCircle },
  { path: "/admin/notifications", label: "Notifications", icon: Bell },
  { path: "/admin/profile", label: "My Profile", icon: User },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (search.trim()) {
      const filtered = menuItems.filter(item =>
        item.label.toLowerCase().includes(search.toLowerCase())
      );
      setResults(filtered);
    } else {
      setResults([]);
    }
  }, [search]);

  const handleSelect = (path) => {
    navigate(path);
    setOpen(false);
    setSearch("");
  };

  return (
    <div className="relative">
      {/* Search Button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 rounded-lg bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center"
        title="Search menu (Cmd+K or Ctrl+K)"
      >
        <Search className="w-5 h-5" strokeWidth={2} />
      </button>

      {/* Search Modal */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setOpen(false)}
          />

          {/* Search Panel */}
          <div className="absolute top-12 right-0 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50">
            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {search.trim() && results.length > 0 ? (
                <div className="p-2">
                  {results.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => handleSelect(item.path)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                    >
                      <item.icon className="w-5 h-5 text-slate-400" strokeWidth={2} />
                      <span className="text-slate-800 dark:text-slate-200 font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              ) : search.trim() ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <p>No menu items found</p>
                </div>
              ) : (
                <div className="p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 font-semibold">All Pages</p>
                  <div className="space-y-1">
                    {menuItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleSelect(item.path)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-left"
                      >
                        <item.icon className="w-5 h-5 text-slate-400" strokeWidth={2} />
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

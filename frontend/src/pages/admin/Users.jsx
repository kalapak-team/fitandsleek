import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { useAuth } from "../../state/auth";
import { useTheme } from "../../state/theme.jsx";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

const pageSize = 10;

function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.customers)) return payload.customers;
  if (Array.isArray(payload?.users)) return payload.users;
  return [];
}

export default function Users({ showCustomers = true, showAdmins = true }) {
  const { user } = useAuth();
  const { mode } = useTheme();
  const isSuperAdmin = useMemo(() => {
    const role = user?.role?.toLowerCase?.();
    return role === "superadmin" || role === "super admin" || role === "super-admin";
  }, [user]);

  const allowAdmins = showAdmins && isSuperAdmin;

  const [customers, setCustomers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(showCustomers);
  const [loadingAdmins, setLoadingAdmins] = useState(allowAdmins);
  const [viewMode, setViewMode] = useState("list");
  const [adminViewMode, setAdminViewMode] = useState("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [adminSearchQuery, setAdminSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [modalContext, setModalContext] = useState("customer");
  const [deleteContext, setDeleteContext] = useState("customer");
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "", password: "" });

  useEffect(() => {
    if (showCustomers) {
      loadCustomers();
    } else {
      setLoadingCustomers(false);
    }
  }, [showCustomers]);

  useEffect(() => {
    if (allowAdmins) {
      loadAdmins();
    } else {
      setLoadingAdmins(false);
    }
  }, [allowAdmins]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const { data } = await api.get("/admin/customers");
      setCustomers(normalizeList(data));
    } catch (err) {
      console.error("Failed to load customers", err);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data } = await api.get("/admin/superadmin/users", { params: { role: "admin", per_page: 50 } });
      setAdmins(normalizeList(data));
    } catch (err) {
      console.error("Failed to load admins", err);
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((cust) =>
      [cust.name, cust.email, cust.phone].some((field) => field?.toString().toLowerCase().includes(q))
    );
  }, [customers, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const allSelected = paginatedCustomers.length > 0 && paginatedCustomers.every((cust) => selectedIds.includes(cust.id));

  const filteredAdmins = useMemo(() => {
    const q = adminSearchQuery.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((adm) => [adm.name, adm.email, adm.phone].some((field) => field?.toString().toLowerCase().includes(q)));
  }, [admins, adminSearchQuery]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !paginatedCustomers.some((cust) => cust.id === id)));
    } else {
      const idsToAdd = paginatedCustomers.map((cust) => cust.id).filter((id) => !selectedIds.includes(id));
      setSelectedIds((prev) => [...prev, ...idsToAdd]);
    }
  };

  const openCreate = (context) => {
    if (context === "admin" && !allowAdmins) return;
    setModalContext(context);
    setEditingUser(null);
    setFormData({ name: "", email: "", phone: "", address: "", password: "" });
    setShowAddModal(true);
  };

  const openEdit = (userItem, context) => {
    if (context === "admin" && !allowAdmins) return;
    setModalContext(context);
    setEditingUser(userItem);
    setFormData({
      name: userItem.name || "",
      email: userItem.email || "",
      phone: userItem.phone || "",
      address: userItem.address || "",
      password: "",
    });
    setShowAddModal(true);
  };

  const openDelete = (userItem, context) => {
    if (context === "admin" && !allowAdmins) return;
    setUserToDelete(userItem);
    setDeleteContext(context);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowDeleteModal(false);
    setEditingUser(null);
    setUserToDelete(null);
    setFormData({ name: "", email: "", phone: "", address: "", password: "" });
  };

  const handleSubmit = async () => {
    if (modalContext === "admin" && !allowAdmins) return;
    const payload = { name: formData.name, email: formData.email, phone: formData.phone, address: formData.address };
    if (!editingUser || modalContext === "admin") {
      if (formData.password) {
        payload.password = formData.password;
        if (modalContext === "admin") payload.password_confirmation = formData.password;
      }
    }

    try {
      if (editingUser) {
        const url = `/admin/${modalContext === "admin" ? "superadmin/admin-users" : "customers"}/${editingUser.id}`;
        await api.put(url, payload);
      } else {
        const url = modalContext === "admin" ? "/admin/superadmin/admin-users" : "/admin/customers";
        await api.post(url, payload);
      }
      if (modalContext === "admin") {
        await loadAdmins();
      } else {
        await loadCustomers();
      }
      closeModals();
    } catch (err) {
      console.error("Failed to save user", err);
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    if (deleteContext === "admin" && !allowAdmins) return;
    try {
      const url = deleteContext === "admin" ? `/admin/superadmin/admin-users/${userToDelete.id}` : `/admin/customers/${userToDelete.id}`;
      await api.delete(url);
      if (deleteContext === "admin") {
        await loadAdmins();
      } else {
        await loadCustomers();
      }
    } catch (err) {
      console.error("Failed to delete user", err);
    } finally {
      closeModals();
    }
  };

  if (loadingCustomers || loadingAdmins) return <AdminContentSkeleton title="Users" />;

  const viewToggleButton = (mode, activeMode, setter, title, icon) => (
    <button
      type="button"
      title={title}
      onClick={() => setter(mode)}
      className={
        "h-8 w-8 rounded-md transition-colors inline-flex items-center justify-center " +
        (activeMode === mode
          ? "bg-black text-white"
          : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")
      }
    >
      {icon}
    </button>
  );

  const isDark = mode === "dark";

  const deleteButtonStyle = {
    backgroundColor: isDark ? "rgba(127, 29, 29, 0.22)" : "#fef2f2",
    color: isDark ? "#fecdd3" : "#991b1b",
    border: `1px solid ${isDark ? "rgba(248, 113, 113, 0.45)" : "#fecdd3"}`,
    borderRadius: "0.5rem",
    height: "2.25rem",
    width: "2.25rem",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 150ms ease",
  };

  const renderUserRow = (item, context) => (
    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
      {context === "customer" && (
        <td className="px-6 py-4">
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => toggleSelect(item.id)}
            className="rounded border-slate-300 dark:border-slate-700"
          />
        </td>
      )}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold overflow-hidden">
            {item.profile_image_url ? (
              <img src={item.profile_image_url} alt={item.name} className="w-full h-full object-cover" />
            ) : (
              item.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{item.name}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 truncate">{item.email || "-"}</td>
      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 truncate">{item.phone || "-"}</td>
      {context === "customer" && (
        <>
          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{item.orders_count ?? 0}</td>
          <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-semibold">
            ${Number(item.total_spent || 0).toFixed(2)}
          </td>
        </>
      )}
      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{formatDate(item.created_at)}</td>
      <td className="px-6 py-4">
        <div className="flex gap-2">
          <button
            onClick={() => openEdit(item, context)}
            title="Edit"
            className="h-9 w-9 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => openDelete(item, context)}
            title="Delete"
            className="transition-colors"
            style={deleteButtonStyle}
            aria-label={`Delete ${context === "admin" ? "admin" : "customer"}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );

  const renderUserCard = (item, context) => (
    <div
      key={item.id}
      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        {context === "customer" && (
          <input
            type="checkbox"
            checked={selectedIds.includes(item.id)}
            onChange={() => toggleSelect(item.id)}
            className="rounded border-slate-300 dark:border-slate-700"
          />
        )}
        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold overflow-hidden flex-shrink-0">
          {item.profile_image_url ? (
            <img src={item.profile_image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            item.name?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{item.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
        <div>
          <span className="text-slate-400 dark:text-slate-500">Phone</span>
          <p className="text-slate-700 dark:text-slate-200 font-medium">{item.phone || "-"}</p>
        </div>
        <div>
          <span className="text-slate-400 dark:text-slate-500">Joined</span>
          <p className="text-slate-700 dark:text-slate-200 font-medium">{formatDate(item.created_at)}</p>
        </div>
        {context === "customer" && (
          <>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Orders</span>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{item.orders_count ?? 0}</p>
            </div>
            <div>
              <span className="text-slate-400 dark:text-slate-500">Total Spent</span>
              <p className="font-bold text-slate-900 dark:text-slate-100">${Number(item.total_spent || 0).toFixed(2)}</p>
            </div>
          </>
        )}
      </div>
      <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => openEdit(item, context)}
          title="Edit"
          className="flex-1 h-9 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => openDelete(item, context)}
          title="Delete"
          className="transition-colors"
          style={{
            ...deleteButtonStyle,
            width: "100%",
          }}
          aria-label={`Delete ${context === "admin" ? "admin" : "customer"}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-2">Admin</p>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white">Users</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your customers and admin team in one place.</p>
          </div>
          <div className="flex gap-3">
            {showCustomers && (
              <button
                onClick={() => openCreate("customer")}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Customer
              </button>
            )}
            {allowAdmins && (
              <button
                onClick={() => openCreate("admin")}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors flex items-center gap-2 font-semibold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Admin
              </button>
            )}
          </div>
        </div>

        {showCustomers && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-12">
            <div className="px-6 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h2>
                <p className="text-slate-500 dark:text-slate-400">Total: {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row lg:items-center">
                {totalPages > 1 && (
                  <div className="text-slate-500 dark:text-slate-400 text-sm text-right">Page {currentPage} of {totalPages}</div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full lg:w-72 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-black dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                  />
                  <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 gap-0.5">
                    {viewToggleButton("list", viewMode, setViewMode, "List view", (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    ))}
                    {viewToggleButton("grid", viewMode, setViewMode, "Grid view", (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                      </svg>
                    ))}
                    {viewToggleButton("split", viewMode, setViewMode, "Split view", (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="8" height="18" rx="1" strokeWidth={2} />
                        <rect x="13" y="3" width="8" height="18" rx="1" strokeWidth={2} />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {loadingCustomers ? (
              <AdminSectionLoader rows={6} />
            ) : paginatedCustomers.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-200 text-lg">No customers found</p>
              </div>
            ) : viewMode === "list" ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/70 text-left text-xs font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                        <th className="px-6 py-4">
                          <input type="checkbox" onChange={toggleSelectAll} checked={allSelected} className="rounded border-slate-300 dark:border-slate-700" />
                        </th>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Email</th>
                        <th className="px-6 py-4">Phone</th>
                        <th className="px-6 py-4">Orders</th>
                        <th className="px-6 py-4">Total Spent</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedCustomers.map((cust) => renderUserRow(cust, "customer"))}
                    </tbody>
                  </table>
                </div>
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 p-6 border-t border-slate-100 dark:border-slate-800">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={
                          "px-3 py-2 rounded transition-colors " +
                          (currentPage === page
                            ? "bg-black text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700")
                        }
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div
                className={
                  "p-6 " +
                  (viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2")
                }
              >
                {paginatedCustomers.map((cust) => renderUserCard(cust, "customer"))}
              </div>
            )}
          </div>
        )}

        {allowAdmins && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="px-6 py-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Administrators</h2>
                <p className="text-slate-500 dark:text-slate-400">Total: {filteredAdmins.length} admin{filteredAdmins.length !== 1 ? "s" : ""}</p>
              </div>
              <div className="flex flex-col gap-3 w-full lg:w-auto lg:flex-row lg:items-center">
                <input
                  type="text"
                  placeholder="Search admins by name, email, or phone"
                  value={adminSearchQuery}
                  onChange={(e) => setAdminSearchQuery(e.target.value)}
                  className="w-full lg:w-72 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:border-black dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
                <div className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1 gap-0.5">
                  {viewToggleButton("list", adminViewMode, setAdminViewMode, "List view", (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  ))}
                  {viewToggleButton("grid", adminViewMode, setAdminViewMode, "Grid view", (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                      <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                      <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                      <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                    </svg>
                  ))}
                  {viewToggleButton("split", adminViewMode, setAdminViewMode, "Split view", (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="8" height="18" rx="1" strokeWidth={2} />
                      <rect x="13" y="3" width="8" height="18" rx="1" strokeWidth={2} />
                    </svg>
                  ))}
                </div>
              </div>
            </div>

            {loadingAdmins ? (
              <AdminSectionLoader rows={4} />
            ) : filteredAdmins.length === 0 ? (
              <div className="p-12 text-center">
                <svg className="w-20 h-20 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-slate-500 dark:text-slate-200 text-lg">No administrators found</p>
              </div>
            ) : adminViewMode === "list" ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/70 text-left text-xs font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Phone</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredAdmins.map((admin) => renderUserRow(admin, "admin"))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div
                className={
                  "p-6 " +
                  (adminViewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2")
                }
              >
                {filteredAdmins.map((admin) => renderUserCard(admin, "admin"))}
              </div>
            )}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-1">{modalContext === "admin" ? "Admin" : "Customer"}</p>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{editingUser ? "Edit" : "Add"} {modalContext === "admin" ? "Administrator" : "Customer"}</h3>
              </div>
              <button
                onClick={closeModals}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Name</span>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-black dark:focus:border-slate-500"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Email</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-black dark:focus:border-slate-500"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Phone</span>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-black dark:focus:border-slate-500"
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span>Address</span>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-black dark:focus:border-slate-500"
                  />
                </label>
              </div>
              {modalContext === "admin" && (
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200 block">
                  <span>Password {editingUser ? "(leave blank to keep)" : ""}</span>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-black dark:focus:border-slate-500"
                  />
                </label>
              )}
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete {deleteContext === "admin" ? "Administrator" : "Customer"}</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Are you sure you want to delete {userToDelete.name}? This action cannot be undone.
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex gap-3 justify-end border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
              <button
                onClick={closeModals}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-slate-800 transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

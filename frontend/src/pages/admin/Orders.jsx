import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { warningConfirm } from "../../lib/swal";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";
import { useTheme } from "../../state/theme.jsx";

function Money({ value }) {
  const n = Number(value || 0);
  return <span>${n.toFixed(2)}</span>;
}

// Status badge colors via inline styles (theme-aware, no Tailwind colors)
const getStatusStyle = (status, mode, primaryColor) => {
  const s = (status || '').toLowerCase();
  const isDark = mode === 'dark';

  if (s === 'completed' || s === 'delivered') {
    return {
      backgroundColor: primaryColor,
      color: '#0b0b0f',
      borderColor: primaryColor,
    };
  }

  if (s === 'pending' || s === 'paid') {
    return {
      backgroundColor: isDark ? '#B45309' : '#FEF3C7',
      color: isDark ? '#FFF7ED' : '#92400E',
      borderColor: isDark ? '#D97706' : '#FCD34D',
    };
  }

  if (s === 'processing' || s === 'shipped' || s === 'preparing') {
    return {
      backgroundColor: isDark ? '#0EA5E9' : '#E0F2FE',
      color: isDark ? '#E0F2FE' : '#075985',
      borderColor: isDark ? '#38BDF8' : '#7DD3FC',
    };
  }

  if (s === 'cancelled') {
    return {
      backgroundColor: isDark ? '#7F1D1D' : '#FEF2F2',
      color: isDark ? '#FEE2E2' : '#991B1B',
      borderColor: isDark ? '#F87171' : '#FCA5A5',
      textDecoration: 'line-through',
    };
  }

  return {
    backgroundColor: isDark ? '#334155' : '#F1F5F9',
    color: isDark ? '#E2E8F0' : '#0F172A',
    borderColor: isDark ? '#475569' : '#CBD5E1',
  };
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminOrders() {
  const { primaryColor, mode } = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewMode, setViewMode] = useState("list");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/orders");
      console.log("Orders API Response:", data);
      setRows(data?.data || []);
    } catch (error) {
      console.error("Failed to load orders:", error.response?.data || error.message);
      setErr(error.response?.data?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => rows.some((o) => o.id === id)));
  }, [rows]);

  const open = async (id) => {
    const { data } = await api.get(`/admin/orders/${id}`);
    setSelected(data);
    setStatus(data.status || "");
  };

  const save = async () => {
    setErr("");
    try {
      const { data } = await api.patch(`/admin/orders/${selected.id}`, { status });
      setSelected(data);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Update failed.");
    }
  };

  const del = async (id) => {
    const confirmRes = await warningConfirm({
      khTitle: "លុបការបញ្ជាទិញ",
      enTitle: "Delete order",
      khText: "តើអ្នកចង់លុបការបញ្ជាទិញនេះមែនទេ?",
      enText: "Are you sure you want to delete this order?",
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await api.delete(`/admin/orders/${id}`);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Delete failed.");
    }
  };

  const filteredRows = rows.filter((o) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(o.id || "").toLowerCase().includes(q) ||
      String(o.user?.name || "").toLowerCase().includes(q) ||
      String(o.user?.email || "").toLowerCase().includes(q) ||
      String(o.status || "").toLowerCase().includes(q)
    );
  });

  const allSelected =
    filteredRows.length > 0 && filteredRows.every((o) => selectedIds.includes(o.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const filteredIds = new Set(filteredRows.map((o) => o.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }
    const next = new Set(selectedIds);
    filteredRows.forEach((o) => next.add(o.id));
    setSelectedIds(Array.from(next));
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmRes = await warningConfirm({
      khTitle: "លុបការបញ្ជាទិញជាច្រើន",
      enTitle: "Delete selected orders",
      khText: `តើអ្នកចង់លុបការបញ្ជាទិញ ${selectedIds.length} មែនទេ?`,
      enText: `Delete ${selectedIds.length} selected orders?`,
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/admin/orders/${id}`)));
      setSelectedIds([]);
      await load();
    } catch (e) {
      setErr(e?.response?.data?.message || "Bulk delete failed.");
    }
  };

  const printSelectedInvoices = async () => {
    if (selectedIds.length === 0) return;
    try {
      const res = await api.post(
        "/admin/orders/invoices/bulk-pdf",
        { order_ids: selectedIds },
        { responseType: "blob" }
      );

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `invoices-bulk-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setErr(e?.response?.data?.message || "Bulk print failed.");
    }
  };

  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;

  if (loading) return <AdminContentSkeleton title="Orders" />;

  return (
    <div className="min-h-full admin-soft text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-4xl font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-11 h-11 bg-black rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </span>
            Orders
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">Manage and track all customer orders</p>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 animate-shake">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-100 font-medium">{err}</span>
            <button onClick={() => setErr("")} className="ml-auto text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Orders Table */}
        <div className="admin-surface rounded-2xl overflow-hidden border admin-border">
          <div className="admin-surface border-b admin-border px-4 md:px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 border admin-border rounded-lg flex items-center justify-center admin-surface">
                <svg className="w-6 h-6 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h3 className="text-slate-800 dark:text-white font-semibold">All Orders</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{filteredRows.length} total orders</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3 justify-end w-full md:w-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders..."
                className="h-10 w-full md:w-64 rounded-lg border admin-border admin-surface px-3 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-[var(--admin-primary)] focus:bg-transparent"
              />
              {/* View Toggle */}
              <div className="inline-flex items-center rounded-lg border admin-border admin-surface p-1 gap-0.5 order-2 md:order-none">
                <button
                  type="button"
                  title="List view"
                  onClick={() => setViewMode("list")}
                  className={"h-8 w-8 rounded-md transition-colors inline-flex items-center justify-center " + (viewMode === "list" ? "bg-[var(--admin-primary)] text-[#0b0b0f]" : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Grid view"
                  onClick={() => setViewMode("grid")}
                  className={"h-8 w-8 rounded-md transition-colors inline-flex items-center justify-center " + (viewMode === "grid" ? "bg-[var(--admin-primary)] text-[#0b0b0f]" : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                    <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} />
                    <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                    <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth={2} />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Split view"
                  onClick={() => setViewMode("split")}
                  className={"h-8 w-8 rounded-md transition-colors inline-flex items-center justify-center " + (viewMode === "split" ? "bg-[var(--admin-primary)] text-[#0b0b0f]" : "text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="3" width="8" height="18" rx="1" strokeWidth={2} />
                    <rect x="13" y="3" width="8" height="18" rx="1" strokeWidth={2} />
                  </svg>
                </button>
              </div>
              {selectedIds.length > 0 && (
                <>
                  <button
                    onClick={printSelectedInvoices}
                    className="px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    style={{
                      backgroundColor: "var(--admin-primary)",
                      color: "#0b0b0f",
                      border: "1px solid var(--admin-primary)"
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6v-8z" />
                    </svg>
                    Print Selected Invoices ({selectedIds.length})
                  </button>
                  <button
                    onClick={deleteSelected}
                    className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 admin-surface rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Selected ({selectedIds.length})
                  </button>
                </>
              )}
              <button
                onClick={load}
                className="px-4 py-2 border admin-border text-slate-700 dark:text-slate-200 admin-surface rounded-lg hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <AdminSectionLoader rows={6} />
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-200 text-lg">No orders yet</p>
              <p className="text-slate-400 dark:text-slate-400 text-sm mt-1">Orders will appear here once customers make purchases</p>
            </div>
          ) : (
            viewMode === "list" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/70 text-left text-xs font-semibold text-slate-600 dark:text-slate-200 uppercase tracking-wider">
                    <th className="px-4 md:px-6 py-3 md:py-4">
                      <input
                        type="checkbox"
                        onChange={toggleSelectAll}
                        checked={allSelected}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Order ID</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Customer</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Status</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Items</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Total</th>
                    <th className="px-4 md:px-6 py-3 md:py-4">Date</th>
                    <th className="px-4 md:px-6 py-3 md:py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRows.map((o) => (
                    <tr key={o.id} className="hover:bg-[rgba(var(--admin-primary-rgb),0.08)] dark:hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition-colors">
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(o.id)}
                          onChange={() => toggleSelect(o.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">#{o.id}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm">
                            {o.user?.name?.charAt(0).toUpperCase() || o.user?.email?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{o.user?.name || 'Guest'}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{o.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span
                          className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border"
                          style={getStatusStyle(o.status, mode, primaryColor)}
                        >
                          {o.status || 'Pending'}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300">{o.items?.length || 0} items</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100"><Money value={o.total} /></span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4">
                        <span className="text-sm text-slate-500 dark:text-slate-400">{formatDate(o.created_at)}</span>
                      </td>
                      <td className="px-4 md:px-6 py-3 md:py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => open(o.id)}
                            title="View"
                            className="h-9 w-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[rgba(var(--admin-primary-rgb),0.12)] border admin-border rounded-lg transition-colors inline-flex items-center justify-center admin-surface"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => window.open(`/admin/orders/${o.id}/invoice`, "_blank")}
                            title="Invoice"
                            className="h-9 w-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-[rgba(var(--admin-primary-rgb),0.12)] border admin-border rounded-lg transition-colors inline-flex items-center justify-center admin-surface"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => del(o.id)}
                            title="Delete"
                            aria-label="Delete order"
                            className="h-9 w-9 rounded-lg transition-colors inline-flex items-center justify-center"
                            style={{
                              color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                              border: `1px solid ${mode === 'dark' ? '#fca5a5' : '#fecaca'}`,
                              backgroundColor: mode === 'dark' ? 'rgba(248,113,113,0.12)' : '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            ) : (
            <div className={"p-6 " + (viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2")}>
              {filteredRows.map((o) => (
                <div key={o.id} className="rounded-xl border admin-border admin-surface p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="rounded"
                      />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">#{o.id}</span>
                    </div>
                    <span
                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border"
                      style={getStatusStyle(o.status, mode, primaryColor)}
                    >
                      {o.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-sm flex-shrink-0">
                      {o.user?.name?.charAt(0).toUpperCase() || o.user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{o.user?.name || 'Guest'}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{o.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>{o.items?.length || 0} items</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm"><Money value={o.total} /></span>
                    <span>{formatDate(o.created_at)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => open(o.id)}
                      title="View"
                      className="flex-1 h-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    </button>
                    <button
                      onClick={() => window.open("/admin/orders/" + o.id + "/invoice", "_blank")}
                      title="Invoice"
                      className="flex-1 h-9 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </button>
                    <button
                      onClick={() => del(o.id)}
                      title="Delete"
                      aria-label="Delete order"
                      className="h-9 w-9 rounded-lg transition-colors inline-flex items-center justify-center"
                      style={{
                        color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                        border: `1px solid ${mode === 'dark' ? '#fca5a5' : '#fecaca'}`,
                        backgroundColor: mode === 'dark' ? 'rgba(248,113,113,0.12)' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )
          )}
        </div>
      </div>

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl p-6 animate-modal-in max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="flex items-start justify-between gap-3 mb-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">Order #{selected.id}</span>
                  <span
                    className="inline-flex px-3 py-1 rounded-full text-xs font-semibold border"
                    style={getStatusStyle(selected.status, mode, primaryColor)}
                  >
                    {selected.status || 'Pending'}
                  </span>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {formatDate(selected.created_at)}
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Customer Info */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Customer Information</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold">
                  {selected.user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{selected.user?.name || 'Guest'}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selected.user?.email}</p>
                </div>
              </div>
            </div>

            {/* Update Status */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Update Status</label>
              <div className="flex gap-3">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex-1 h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-black dark:focus:border-slate-400 focus:bg-white dark:focus:bg-slate-950 transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={save}
                  className="h-12 px-6 rounded-xl bg-black text-white font-semibold hover:bg-slate-800 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Order Items</h4>
              <div className="space-y-3">
                {(selected.items || []).map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold overflow-hidden">
                        {it.product?.image_url ? (
                          <img src={it.product.image_url} alt={it.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{it.product?.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Qty: {Number(it.qty ?? it.quantity ?? 0)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Paid: <Money value={it.price} />
                          {Number(it.product?.price || 0) > Number(it.price || 0) && (
                            <span className="ml-1 line-through text-slate-400">
                              <Money value={it.product?.price} />
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100"><Money value={it.line_total} /></span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-between items-center">
              <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">Total Amount</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white"><Money value={selected.total} /></span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-modal-in {
          animation: modal-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}


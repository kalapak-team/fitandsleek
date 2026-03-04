import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { useTheme } from "../../state/theme.jsx";
import { closeSwal, errorAlert, loadingAlert, toastSuccess, warningConfirm } from "../../lib/swal";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";

const emptyForm = {
  name: "",
  slug: "",
  sort_order: 0,
  is_active: true,
  logo: null,
};

export default function AdminBrands() {
  const { primaryColor, mode } = useTheme();
  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;
  const accentIsWhite = (accentColor || "").toUpperCase() === "#FFFFFF";
  const headerIconColor = accentIsWhite ? "#0b0b0f" : "#FFFFFF";
  const deleteButtonStyle = {
    backgroundColor: mode === "dark" ? "rgba(127, 29, 29, 0.22)" : "#fef2f2",
    color: mode === "dark" ? "#fecdd3" : "#991b1b",
    border: `1px solid ${mode === "dark" ? "rgba(248, 113, 113, 0.45)" : "#fecdd3"}`,
    padding: "8px 12px",
    borderRadius: "10px",
    fontWeight: 600,
    fontSize: "0.875rem",
    transition: "all 150ms ease",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
  };
  const deleteIconButtonStyle = {
    ...deleteButtonStyle,
    padding: "8px",
    borderRadius: "10px",
    fontWeight: 500,
    fontSize: "0.85rem",
  };
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [toastOn, setToastOn] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [orderedRows, setOrderedRows] = useState([]);
  const [dragId, setDragId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const getValidationMessage = (error) => {
    const responseMessage = error?.response?.data?.message;
    const errors = error?.response?.data?.errors;
    if (errors && typeof errors === "object") {
      const first = Object.values(errors).flat().find(Boolean);
      return first || responseMessage || "Validation failed.";
    }
    return responseMessage || error?.message || "Create failed.";
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/admin/brands");
      setRows(data?.data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load brands");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => rows.some((b) => b.id === id)));
  }, [rows]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setToastOn(true);
    setTimeout(() => {
      setToastOn(false);
      setTimeout(() => setSuccess(""), 300);
    }, 2500);
  };

  const onPickFile = (file) => {
    setForm((p) => ({ ...p, logo: file }));
  };

  const onPickFileEdit = (file) => {
    setEditing((p) => ({ ...p, logo: file }));
  };

  const create = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setErr("");
    setCreateError("");
    setIsCreating(true);
    loadingAlert({
      khTitle: "កំពុងបង្កើតម៉ាក",
      enTitle: "Creating brand",
      khText: "សូមរង់ចាំបន្តិច",
      enText: "Please wait",
    });
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      if (form.slug) fd.append("slug", form.slug);
      fd.append("sort_order", String(form.sort_order ?? 0));
      fd.append("is_active", form.is_active ? "1" : "0");
      if (!form.logo) throw new Error("Logo is required");
      fd.append("logo", form.logo);

      const response = await api.post("/admin/brands", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (![200, 201].includes(response?.status)) {
        throw new Error("Create failed.");
      }

      closeSwal();
      setForm(emptyForm);
      setShowCreateForm(false);
      await toastSuccess({
        khText: "បានបង្កើតម៉ាកដោយជោគជ័យ",
        enText: "Created successfully!",
      });
      await load();
    } catch (e2) {
      closeSwal();
      const detail = getValidationMessage(e2);
      setErr(detail);
      const slugHint = String(detail).toLowerCase().includes("slug")
        ? `សូមបំពេញ Slug - ${detail}`
        : detail;
      setCreateError(slugHint);
      await errorAlert({
        khTitle: "បង្កើតម៉ាកបរាជ័យ",
        enTitle: "Create failed",
        detail: slugHint,
      });
    } finally {
      closeSwal();
      setIsCreating(false);
    }
  };

  const startEdit = (b) => {
    setErr("");
    setEditing({
      id: b.id,
      name: b.name || "",
      slug: b.slug || "",
      sort_order: b.sort_order ?? 0,
      is_active: !!b.is_active,
      logo_url: b.logo_url || null,
      logo: null,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setErr("");
    try {
      const fd = new FormData();
      fd.append("name", editing.name);
      if (editing.slug) fd.append("slug", editing.slug);
      fd.append("sort_order", String(editing.sort_order ?? 0));
      fd.append("is_active", editing.is_active ? "1" : "0");
      if (editing.logo) fd.append("logo", editing.logo);
      // Laravel apiResource uses PUT/PATCH. We use POST + _method for multipart.
      fd.append("_method", "PATCH");

      await api.post(`/admin/brands/${editing.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEditing(null);
      showSuccess("Brand updated");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Update failed.");
    }
  };


  const del = async (id) => {
    const confirmRes = await warningConfirm({
      khTitle: "លុបម៉ាក",
      enTitle: "Delete brand",
      khText: "តើអ្នកចង់លុបម៉ាកនេះមែនទេ?",
      enText: "Delete this brand?",
    });
    if (!confirmRes.isConfirmed) return;
    setErr("");
    try {
      await api.delete(`/admin/brands/${id}`);
      showSuccess("Brand deleted");
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Delete failed.");
    }
  };

  const previewCreate = useMemo(() => {
    if (!form.logo) return null;
    return URL.createObjectURL(form.logo);
  }, [form.logo]);

  const previewEdit = useMemo(() => {
    if (!editing?.logo) return null;
    return URL.createObjectURL(editing.logo);
  }, [editing?.logo]);

  const fullSortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aOrder = Number(a.sort_order ?? 0);
      const bOrder = Number(b.sort_order ?? 0);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return Number(b.id) - Number(a.id);
    });
  }, [rows]);

  const applyFilter = (list) => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) =>
      String(b.name || "").toLowerCase().includes(q) ||
      String(b.slug || "").toLowerCase().includes(q)
    );
  };

  useEffect(() => {
    setOrderedRows(applyFilter(fullSortedRows));
  }, [fullSortedRows, search]);

  if (loading) return <AdminContentSkeleton lines={3} imageHeight={200} className="mt-4" />;

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const allSelected =
    orderedRows.length > 0 && orderedRows.every((b) => selectedIds.includes(b.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const filteredIds = new Set(orderedRows.map((b) => b.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
      return;
    }
    const next = new Set(selectedIds);
    orderedRows.forEach((b) => next.add(b.id));
    setSelectedIds(Array.from(next));
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmRes = await warningConfirm({
      khTitle: "លុបម៉ាកជាច្រើន",
      enTitle: "Delete selected brands",
      khText: `តើអ្នកចង់លុបម៉ាក ${selectedIds.length} មែនទេ?`,
      enText: `Delete ${selectedIds.length} selected brands?`,
    });
    if (!confirmRes.isConfirmed) return;
    setErr("");
    try {
      await Promise.all(selectedIds.map((id) => api.delete(`/admin/brands/${id}`)));
      showSuccess("Selected brands deleted");
      setSelectedIds([]);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Delete failed.");
    }
  };

  const moveItem = (list, fromIndex, toIndex) => {
    const next = [...list];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    return next;
  };

  const persistOrder = async (newFullOrder) => {
    try {
      const updates = [];
      newFullOrder.forEach((b, idx) => {
        const nextOrder = idx + 1;
        if (Number(b.sort_order ?? 0) !== nextOrder) {
          updates.push(api.patch(`/admin/brands/${b.id}`, { sort_order: nextOrder }));
        }
      });
      if (updates.length === 0) return;
      await Promise.all(updates);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Reorder failed.");
    }
  };

  const handleDrop = async (targetId) => {
    if (!dragId || dragId === targetId) return;
    const fromIndex = fullSortedRows.findIndex((b) => b.id === dragId);
    const toIndex = fullSortedRows.findIndex((b) => b.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const newFullOrder = moveItem(fullSortedRows, fromIndex, toIndex);
    setOrderedRows(applyFilter(newFullOrder));
    setDragId(null);
    await persistOrder(newFullOrder);
  };

  const swapSortOrder = async (current, target) => {
    if (!current || !target) return;
    setErr("");
    try {
      const currentOrder = Number(current.sort_order ?? 0);
      const targetOrder = Number(target.sort_order ?? 0);
      await Promise.all([
        api.patch(`/admin/brands/${current.id}`, { sort_order: targetOrder }),
        api.patch(`/admin/brands/${target.id}`, { sort_order: currentOrder }),
      ]);
      await load();
    } catch (e2) {
      setErr(e2?.response?.data?.message || "Move failed.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      {/* Toast */}
      <div
        className={`fixed top-6 right-6 z-50 transition-all duration-500 ease-out transform ${toastOn ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
          }`}
      >
        {success && (
          <div className="bg-emerald-500 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="font-medium">{success}</span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
              <span className="w-12 h-12 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: accentColor }}>
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: headerIconColor }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 4h10M7 8h10M7 12h10M7 16h10M7 20h10"
                  />
                </svg>
              </span>
              Brands
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              Manage brand logos shown on the Home “CATEGORIES” row
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className={`px-6 py-3 font-semibold rounded-xl shadow-sm transition-all duration-200 flex items-center gap-2 ${accentIsWhite ? "border border-slate-300" : "text-white"}`}
            style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Brand
          </button>
        </div>

        {err && (
          <div className="mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3">
            <svg
              className="w-6 h-6 text-red-500 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-red-700 dark:text-red-100 font-medium">{err}</span>
            <button
              onClick={() => setErr("")}
              className="ml-auto text-red-400 dark:text-red-300 hover:text-red-600 dark:hover:text-red-200 transition-colors"
              type="button"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Create Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => !isCreating && setShowCreateForm(false)}
            />
            <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add Brand</h2>
                <button
                  onClick={() => !isCreating && setShowCreateForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  type="button"
                  disabled={isCreating}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={create} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nike"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Slug (optional)</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="nike"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Sort order</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                    value={form.sort_order}
                    onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                  />
                </div>
                <div className="flex items-end gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, is_active: !p.is_active }))}
                      className="relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-slate-300 dark:focus:ring-slate-600 dark:focus:ring-offset-slate-800"
                      style={{ backgroundColor: form.is_active ? (mode === 'dark' ? '#3b82f6' : '#2563eb') : (mode === 'dark' ? '#334155' : '#e2e8f0') }}
                    >
                      <span className="w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300" style={{ transform: form.is_active ? 'translateX(24px)' : 'translateX(4px)' }} />
                    </button>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Active</span>
                  </label>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Logo (PNG/JPG/WebP)</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={(e) => onPickFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-black file:bg-white file:text-black"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Recommended: transparent PNG, height ~80px</p>
                  </div>
                  <div className="h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {previewCreate ? (
                      <img src={previewCreate} alt="Preview" className="h-16 w-auto object-contain" />
                    ) : (
                      <span className="text-slate-400 text-sm">No logo</span>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center justify-end">
                  {createError ? (
                    <div className="mr-auto rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-100">
                      {createError}
                    </div>
                  ) : null}
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`px-8 py-3 font-bold rounded-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed border ${accentIsWhite ? 'border-slate-300' : ''}`}
                    style={{ backgroundColor: accentColor, color: accentIsWhite ? '#0b0b0f' : '#FFFFFF', borderColor: accentIsWhite ? '#cbd5e1' : accentColor }}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-6 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">All Brands</h2>
            <div className="flex items-center gap-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search brands..."
                className="h-10 w-64 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm text-slate-700 dark:text-slate-100 outline-none focus:border-slate-500"
              />
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-0"
                />
                Select all
              </label>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={deleteSelected}
                  style={deleteButtonStyle}
                  className="transition-all"
                >
                  Delete Selected ({selectedIds.length})
                </button>
              )}
              <button
                type="button"
                onClick={load}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-white transition dark:border-slate-700 dark:text-white dark:hover:bg-slate-800"
              >
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-slate-500 dark:text-slate-300">Loading…</div>
          ) : orderedRows.length === 0 ? (
            <div className="p-8 text-slate-500 dark:text-slate-300">No brands found.</div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {orderedRows.map((b) => (
                <div
                  key={b.id}
                  className="p-6 flex items-center gap-6 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(b.id)}
                >
                  <div
                    className="cursor-move text-slate-400 hover:text-slate-600"
                    draggable
                    onDragStart={() => setDragId(b.id)}
                    onDragEnd={() => setDragId(null)}
                    title="Drag to reorder"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9h.01M8 15h.01M12 9h.01M12 15h.01M16 9h.01M16 15h.01" />
                    </svg>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(b.id)}
                    onChange={() => toggleSelect(b.id)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-slate-900 focus:ring-0"
                  />
                  <div className="w-32 h-16 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {b.logo_url ? (
                      <img src={b.logo_url} alt={b.name} className="h-10 w-auto object-contain" />
                    ) : (
                      <span className="text-slate-400 text-sm">No logo</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{b.name}</p>
                      <span
                        className="text-xs px-2 py-1 rounded-full border font-semibold"
                        style={b.is_active
                          ? { backgroundColor: accentIsWhite ? '#0b0b0f' : accentColor, color: '#FFFFFF', borderColor: accentIsWhite ? '#cbd5e1' : accentColor }
                          : { backgroundColor: mode === 'dark' ? '#1f2937' : '#f1f5f9', color: mode === 'dark' ? '#e2e8f0' : '#0f172a', borderColor: mode === 'dark' ? '#334155' : '#cbd5e1' }
                        }
                      >
                        {b.is_active ? 'Active' : 'Hidden'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Slug: {b.slug}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sort: {b.sort_order}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => del(b.id)}
                      style={deleteIconButtonStyle}
                      className="transition-all"
                      title="Delete"
                      aria-label="Delete brand"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Edit Brand</h3>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="text-slate-500 hover:text-slate-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Name</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                  value={editing.name}
                  onChange={(e) => setEditing((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Slug</label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                  value={editing.slug}
                  onChange={(e) => setEditing((p) => ({ ...p, slug: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Sort order</label>
                <input
                  type="number"
                  min={0}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-slate-500"
                  value={editing.sort_order}
                  onChange={(e) => setEditing((p) => ({ ...p, sort_order: Number(e.target.value) }))}
                />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <button
                    type="button"
                    onClick={() => setEditing((p) => ({ ...p, is_active: !p.is_active }))}
                    className="relative inline-flex h-8 w-14 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-slate-300 dark:focus:ring-slate-600 dark:focus:ring-offset-slate-800"
                    style={{ backgroundColor: editing.is_active ? (mode === 'dark' ? '#3b82f6' : '#2563eb') : (mode === 'dark' ? '#334155' : '#e2e8f0') }}
                  >
                    <span className="w-6 h-6 bg-white rounded-full shadow-lg transform transition-transform duration-300" style={{ transform: editing.is_active ? 'translateX(24px)' : 'translateX(4px)' }} />
                  </button>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Active</span>
                </label>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Replace logo (optional)</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => onPickFileEdit(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-black file:bg-white file:text-black"
                  />
                </div>
                <div className="h-24 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                  {previewEdit ? (
                    <img src={previewEdit} alt="Preview" className="h-16 w-auto object-contain" />
                  ) : editing.logo_url ? (
                    <img src={editing.logo_url} alt="Current" className="h-16 w-auto object-contain" />
                  ) : (
                    <span className="text-slate-400 text-sm">No logo</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-black dark:text-slate-100 bg-white dark:bg-slate-900 hover:bg-white transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all duration-200 border ${accentIsWhite ? 'border-slate-300' : ''}`}
                style={{ backgroundColor: accentColor, color: accentIsWhite ? '#0b0b0f' : '#FFFFFF', borderColor: accentIsWhite ? '#cbd5e1' : accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useState } from "react";
import { resolveImageUrl } from "../../lib/images";
import api from "../../lib/api";
import Swal, { errorAlert, toastSuccess, warningConfirm } from "../../lib/swal";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";
import { useTheme } from "@/state/theme";

export default function AdminReplacementCases() {
  const { mode } = useTheme();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "all" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [search, setSearch] = useState("");

  const loadCases = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      params.append("page", page);
      params.append("per_page", 15);
      const { data } = await api.get(`/admin/replacement-cases?${params}`);
      setCases(data.data.data || []);
      setTotalPages(data.data.last_page || 1);
      setCurrentPage(page);
    } catch (e) {
      console.error("Failed to load cases", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCases(1); }, [filters]);

  const handleApprove = async () => {
    const confirmRes = await warningConfirm({
      khTitle: "អនុម័តសំណើប្តូរ", enTitle: "Approve replacement",
      khText: "តើអ្នកចង់អនុម័តសំណើនេះមែនទេ?", enText: "Approve this replacement case?",
    });
    if (!confirmRes.isConfirmed) return;
    setActionInProgress(true);
    try {
      const { data } = await api.post(`/admin/replacement-cases/${selectedCase.id}/approve`);
      loadCases(currentPage);
      setSelectedCase(data.data || selectedCase);
      await toastSuccess({ khText: "បានអនុម័តសំណើដោយជោគជ័យ", enText: "Replacement approved" });
    } catch (e) {
      errorAlert({ enTitle: "Approve failed", detail: e.response?.data?.message || e.message });
    } finally { setActionInProgress(false); }
  };

  const handleReject = async () => {
    const inputRes = await Swal.fire({
      icon: "warning", title: "មូលហេតុបដិសេធ (Rejection Reason)",
      input: "text", showCancelButton: true, confirmButtonColor: "#497869",
    });
    const reason = inputRes.value?.trim();
    if (!inputRes.isConfirmed || !reason) return;
    setActionInProgress(true);
    try {
      await api.post(`/admin/replacement-cases/${selectedCase.id}/reject`, { notes: reason });
      loadCases(currentPage);
      setShowDetails(false);
      await toastSuccess({ khText: "បានបដិសេធសំណើដោយជោគជ័យ", enText: "Replacement rejected" });
    } catch (e) {
      errorAlert({ enTitle: "Reject failed", detail: e.response?.data?.message || e.message });
    } finally { setActionInProgress(false); }
  };

  const handleComplete = async () => {
    const confirmRes = await warningConfirm({
      khTitle: "បញ្ចប់សំណើ", enTitle: "Complete case",
      khText: "តើអ្នកចង់សម្គាល់ថាបានបញ្ចប់មែនទេ?", enText: "Mark as completed?",
    });
    if (!confirmRes.isConfirmed) return;
    setActionInProgress(true);
    try {
      const { data } = await api.post(`/admin/replacement-cases/${selectedCase.id}/complete`);
      loadCases(currentPage);
      setSelectedCase(data.data || selectedCase);
      await toastSuccess({ khText: "បានបញ្ចប់សំណើដោយជោគជ័យ", enText: "Case completed" });
    } catch (e) {
      errorAlert({ enTitle: "Complete failed", detail: e.response?.data?.message || e.message });
    } finally { setActionInProgress(false); }
  };

  // ប្រើ Inline Style ដើម្បីធានាថាពណ៌មិនលោតទៅបៃតងក្នុង Dark Mode
  const getStatusStyles = (status) => {
    const isDark = mode === "dark";
    switch (status) {
      case "pending":
        return {
          backgroundColor: isDark ? "rgba(245, 158, 11, 0.15)" : "#fef3c7",
          color: isDark ? "#fbbf24" : "#92400e",
          borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#fde68a",
        };
      case "approved":
        return {
          backgroundColor: "#059669",
          color: "#ffffff",
          borderColor: "#059669",
        };
      case "rejected":
        return {
          backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
          color: isDark ? "#f87171" : "#991b1b",
          borderColor: isDark ? "rgba(239, 68, 68, 0.4)" : "#fecaca",
        };
      case "completed":
        return {
          backgroundColor: isDark ? "rgba(16, 185, 129, 0.15)" : "#d1fae5",
          color: isDark ? "#34d399" : "#065f46",
          borderColor: isDark ? "rgba(16, 185, 129, 0.3)" : "#a7f3d0",
        };
      default:
        return {
          backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
          color: isDark ? "#94a3b8" : "#475569",
          borderColor: isDark ? "#334155" : "#e2e8f0",
        };
    }
  };

  const filteredCases = cases.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(c.id || "").toLowerCase().includes(q) ||
      String(c.order?.order_number || "").toLowerCase().includes(q) ||
      String(c.order?.user?.name || "").toLowerCase().includes(q)
    );
  });

  if (loading) return <AdminContentSkeleton title="Replacement Cases" />;

  return (
    <div className="min-h-screen admin-soft text-slate-800 dark:text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Replacement Cases</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage customer replacement requests</p>
        </div>

        <div className="admin-surface border admin-border rounded-xl p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:outline-none dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ID, Order #..."
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:outline-none dark:text-white"
              />
            </div>
            <div className="flex items-end">
              <button onClick={() => {setSearch(""); setFilters({status: "all"});}} className="w-full px-4 py-2 border admin-border rounded-lg hover:bg-slate-50 dark:hover:bg-white/5 transition dark:text-white">Reset</button>
            </div>
          </div>
        </div>

        <div className="admin-surface border admin-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b admin-border">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">ID</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Customer</th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase text-slate-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCases.map((caseItem) => (
                  <tr key={caseItem.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold dark:text-white">#{caseItem.id}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{caseItem.order?.order_number}</td>
                    <td className="px-6 py-4 text-slate-900 dark:text-white font-medium">{caseItem.order?.user?.name || "N/A"}</td>
                    <td className="px-6 py-4">
                      <span
                        style={getStatusStyles(caseItem.status)}
                        className="px-3 py-1 rounded-full text-[11px] font-black uppercase border"
                      >
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setSelectedCase(caseItem); setShowDetails(true); }} className="px-3 py-1.5 border admin-border rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/5 dark:text-white">Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showDetails && selectedCase && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="admin-surface border admin-border rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="p-6 border-b admin-border flex justify-between items-center">
                <h3 className="text-xl font-bold dark:text-white">Case Details</h3>
                <button onClick={() => setShowDetails(false)} className="dark:text-white">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex justify-between border-b admin-border pb-2">
                  <span className="text-slate-500 text-sm">Status</span>
                  <span style={getStatusStyles(selectedCase.status)} className="px-3 py-0.5 rounded-full text-[10px] font-bold uppercase border">
                    {selectedCase.status}
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Reason</label>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 italic">"{selectedCase.reason}"</p>
                </div>
                {selectedCase.notes && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900">
                    <label className="text-[10px] font-bold uppercase text-amber-600">Admin Notes</label>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedCase.notes}</p>
                  </div>
                )}
              </div>
              <div className="p-6 bg-slate-50 dark:bg-white/5 border-t admin-border flex justify-end gap-3">
                {selectedCase.status === "pending" && (
                  <>
                    <button onClick={handleReject} className="px-4 py-2 text-red-600 font-bold text-xs uppercase">Reject</button>
                    <button onClick={handleApprove} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase">Approve</button>
                  </>
                )}
                {selectedCase.status === "approved" && (
                  <button onClick={handleComplete} className="px-6 py-2 bg-slate-900 dark:bg-white dark:text-black text-white rounded-xl font-bold text-xs uppercase">Complete</button>
                )}
                <button onClick={() => setShowDetails(false)} className="px-4 py-2 border admin-border rounded-xl text-xs font-bold dark:text-white">Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
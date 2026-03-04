import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { errorAlert, toastSuccess, warningConfirm } from "../../lib/swal";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";
import { useTheme } from "../../state/theme.jsx";

export default function AdminPayments() {
  const { primaryColor, mode } = useTheme();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    method: "all",
    from_date: "",
    to_date: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [search, setSearch] = useState("");

  const loadPayments = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.method !== "all") params.append("method", filters.method);
      if (filters.from_date) params.append("from_date", filters.from_date);
      if (filters.to_date) params.append("to_date", filters.to_date);
      params.append("page", page);
      params.append("per_page", 15);

      const { data } = await api.get(`/admin/payments?${params}`);
      setPayments(data.data.data || []);
      setTotalPages(data.data.last_page || 1);
      setCurrentPage(page);
    } catch (e) {
      console.error("Failed to load payments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments(1);
  }, [filters]);

  const handleVerify = async (payment) => {
    const confirmRes = await warningConfirm({
      khTitle: "បញ្ជាក់ការទូទាត់",
      enTitle: "Verify payment",
      khText: `តើអ្នកចង់បញ្ជាក់ការទូទាត់ #${payment.id} មែនទេ?`,
      enText: `Verify payment #${payment.id}? This will mark it as successful.`,
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await api.post(`/admin/payments/${payment.id}/verify`);
      loadPayments(currentPage);
      setShowDetails(false);
      await toastSuccess({
        khText: "បានបញ្ជាក់ការទូទាត់ដោយជោគជ័យ",
        enText: "Payment verified successfully",
      });
    } catch (e) {
      console.error("Failed to verify payment", e);
      await errorAlert({
        khTitle: "បញ្ជាក់ការទូទាត់បរាជ័យ",
        enTitle: "Verification failed",
        detail: "Failed to verify payment: " + (e.response?.data?.message || e.message),
      });
    }
  };

  const handleReject = async (payment) => {
    const confirmRes = await warningConfirm({
      khTitle: "បដិសេធការទូទាត់",
      enTitle: "Reject payment",
      khText: `តើអ្នកចង់បដិសេធការទូទាត់ #${payment.id} មែនទេ?`,
      enText: `Reject payment #${payment.id}? This will mark it as failed.`,
    });
    if (!confirmRes.isConfirmed) return;
    try {
      await api.post(`/admin/payments/${payment.id}/reject`);
      loadPayments(currentPage);
      setShowDetails(false);
      await toastSuccess({
        khText: "បានបដិសេធការទូទាត់ដោយជោគជ័យ",
        enText: "Payment rejected successfully",
      });
    } catch (e) {
      console.error("Failed to reject payment", e);
      await errorAlert({
        khTitle: "បដិសេធការទូទាត់បរាជ័យ",
        enTitle: "Rejection failed",
        detail: "Failed to reject payment: " + (e.response?.data?.message || e.message),
      });
    }
  };

  const showPaymentDetails = async (payment) => {
    try {
      const { data } = await api.get(`/admin/payments/${payment.id}`);
      setSelectedPayment(data.data);
      setShowDetails(true);
    } catch (e) {
      console.error("Failed to fetch payment details", e);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    const isDark = mode === 'dark';
    if (s === 'success') return { backgroundColor: isDark ? '#14532d' : '#dcfce7', color: isDark ? '#bbf7d0' : '#166534', borderColor: isDark ? '#16a34a' : '#86efac' };
    if (s === 'pending') return { backgroundColor: isDark ? '#422006' : '#fef9c3', color: isDark ? '#fcd34d' : '#854d0e', borderColor: isDark ? '#f59e0b' : '#fde68a' };
    if (s === 'failed') return { backgroundColor: isDark ? '#7f1d1d' : '#fee2e2', color: isDark ? '#fecdd3' : '#991b1b', borderColor: isDark ? '#f87171' : '#fecaca' };
    if (s === 'refunded') return { backgroundColor: isDark ? '#0f172a' : '#dbeafe', color: isDark ? '#bfdbfe' : '#1d4ed8', borderColor: isDark ? '#38bdf8' : '#bfdbfe' };
    return { backgroundColor: isDark ? '#334155' : '#f1f5f9', color: isDark ? '#e2e8f0' : '#0f172a', borderColor: isDark ? '#475569' : '#cbd5e1' };
  };

  const formatAmount = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(2) : "0.00";
  };

  const getMethodBadge = (method) => {
    const methodMap = {
      card: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
      bank: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      wallet: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      crypto: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
    };
    return methodMap[method] || "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100";
  };

  const filteredPayments = payments.filter((payment) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(payment.id || "").toLowerCase().includes(q) ||
      String(payment.order?.order_number || "").toLowerCase().includes(q) ||
      String(payment.order?.user?.name || "").toLowerCase().includes(q) ||
      String(payment.method || "").toLowerCase().includes(q) ||
      String(payment.status || "").toLowerCase().includes(q)
    );
  });

  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;

  if (loading) return <AdminContentSkeleton title="Payments" />;

  return (
    <div className="min-h-full admin-soft text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Payments Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View and manage all payment transactions
          </p>
        </div>

        {/* Filters */}
        <div className="admin-surface rounded-xl border admin-border p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-4 py-2 border admin-border admin-surface text-slate-800 dark:text-slate-100 rounded-lg focus:border-[var(--admin-primary)] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Method
              </label>
              <select
                value={filters.method}
                onChange={(e) =>
                  setFilters({ ...filters, method: e.target.value })
                }
                className="w-full px-4 py-2 border admin-border admin-surface text-slate-800 dark:text-slate-100 rounded-lg focus:border-[var(--admin-primary)] focus:outline-none"
              >
                <option value="all">All Methods</option>
                <option value="card">Card</option>
                <option value="bank">Bank Transfer</option>
                <option value="wallet">Wallet</option>
                <option value="crypto">Crypto</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                From Date
              </label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) =>
                  setFilters({ ...filters, from_date: e.target.value })
                }
                className="w-full px-4 py-2 border admin-border admin-surface text-slate-800 dark:text-slate-100 rounded-lg focus:border-[var(--admin-primary)] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                To Date
              </label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) =>
                  setFilters({ ...filters, to_date: e.target.value })
                }
                className="w-full px-4 py-2 border admin-border admin-surface text-slate-800 dark:text-slate-100 rounded-lg focus:border-[var(--admin-primary)] focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    status: "all",
                    method: "all",
                    from_date: "",
                    to_date: "",
                  })
                }
                className="w-full px-4 py-2 border admin-border text-slate-700 dark:text-slate-200 rounded-lg admin-surface hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition"
              >
                Reset
              </button>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search payments..."
                className="w-full px-4 py-2 border admin-border admin-surface text-slate-800 dark:text-slate-100 rounded-lg focus:border-[var(--admin-primary)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && <AdminSectionLoader rows={6} />}

        {/* Payments Table */}
        {!loading && (
          <div className="admin-surface rounded-xl border admin-border overflow-hidden shadow-sm">
            {filteredPayments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">
                  No payments found
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {filteredPayments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="hover:bg-[rgba(var(--admin-primary-rgb),0.08)] dark:hover:bg-[rgba(var(--admin-primary-rgb),0.12)] transition"
                        >
                          <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 font-medium">
                            #{payment.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                            {payment.order?.order_number || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                            {payment.order?.user?.name || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            ${formatAmount(payment.amount)}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getMethodBadge(
                                payment.method
                              )}`}
                            >
                              {payment.method}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium border"
                              style={getStatusBadge(payment.status)}
                            >
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5">
                              {/* View */}
                              <button
                                onClick={() => showPaymentDetails(payment)}
                                title="View details"
                                className="h-9 w-9 border admin-border text-slate-600 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] rounded-lg transition-colors inline-flex items-center justify-center admin-surface"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                              </button>
                              {payment.status === "pending" && (
                                <>
                                  {/* Verify */}
                                  <button
                                    onClick={() => handleVerify(payment)}
                                    title="Verify payment"
                                    aria-label="Verify payment"
                                    className="h-9 w-9 rounded-lg transition-colors inline-flex items-center justify-center"
                                    style={{
                                      color: mode === 'dark' ? '#bbf7d0' : '#15803d',
                                      border: `1px solid ${mode === 'dark' ? '#22c55e' : '#86efac'}`,
                                      backgroundColor: mode === 'dark' ? 'rgba(34,197,94,0.12)' : '#fff',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                  </button>
                                  {/* Reject */}
                                  <button
                                    onClick={() => handleReject(payment)}
                                    title="Reject payment"
                                    aria-label="Reject payment"
                                    className="h-9 w-9 rounded-lg transition-colors inline-flex items-center justify-center"
                                    style={{
                                      color: mode === 'dark' ? '#fca5a5' : '#dc2626',
                                      border: `1px solid ${mode === 'dark' ? '#fca5a5' : '#fecaca'}`,
                                      backgroundColor: mode === 'dark' ? 'rgba(248,113,113,0.12)' : '#fff',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t admin-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 dark:text-slate-300 shrink-0">
                      Page <span className="font-medium text-slate-700 dark:text-slate-100">{currentPage}</span> of <span className="font-medium text-slate-700 dark:text-slate-100">{totalPages}</span>
                    </p>

                    <div className="inline-flex items-center gap-1">
                      {/* First */}
                      <button
                        onClick={() => loadPayments(1)}
                        disabled={currentPage === 1}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border admin-border text-slate-500 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:border-[rgba(var(--admin-primary-rgb),0.5)] disabled:opacity-35 disabled:cursor-not-allowed transition text-xs"
                        title="First page"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                      </button>

                      {/* Prev */}
                      <button
                        onClick={() => loadPayments(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border admin-border text-slate-500 dark:text-slate-300 hover:bg-[rgba(var(--admin-primary-rgb),0.12)] hover:border-[rgba(var(--admin-primary-rgb),0.5)] disabled:opacity-35 disabled:cursor-not-allowed transition"
                        title="Previous page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>

                      {/* Smart page numbers */}
                      {(() => {
                        const delta = 1;
                        const range = [];
                        const rangeWithDots = [];
                        let l;
                        for (let i = 1; i <= totalPages; i++) {
                          if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                            range.push(i);
                          }
                        }
                        for (const i of range) {
                          if (l !== undefined) {
                            if (i - l === 2) rangeWithDots.push(l + 1);
                            else if (i - l > 2) rangeWithDots.push("...");
                          }
                          rangeWithDots.push(i);
                          l = i;
                        }
                        return rangeWithDots.map((item, idx) =>
                          item === "..." ? (
                            <span key={"dot-" + idx} className="h-9 w-9 flex items-center justify-center text-sm text-slate-400 select-none">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => loadPayments(item)}
                              className={"h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition " + (currentPage === item
                                ? "bg-slate-900 text-white shadow-sm"
                                : "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600"
                              )}
                            >
                              {item}
                            </button>
                          )
                        );
                      })()}

                      {/* Next */}
                      <button
                        onClick={() => loadPayments(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition"
                        title="Next page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Last */}
                      <button
                        onClick={() => loadPayments(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 disabled:opacity-35 disabled:cursor-not-allowed transition text-xs"
                        title="Last page"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Payment Details Modal */}
        {showDetails && selectedPayment && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-800">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Payment Details
                  </h3>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Payment ID
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    #{selectedPayment.id}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Order
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedPayment.order?.order_number}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Customer
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {selectedPayment.order?.user?.name}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Amount
                  </p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    ${formatAmount(selectedPayment.amount)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Method
                  </p>
                  <p className="text-lg capitalize text-slate-900 dark:text-slate-100">
                    {selectedPayment.method}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Status
                  </p>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium inline-block ${getStatusBadge(
                      selectedPayment.status
                    )}`}
                  >
                    {selectedPayment.status}
                  </span>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Transaction ID
                  </p>
                  <p className="text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
                    {selectedPayment.transaction_id || "N/A"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Date
                  </p>
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {new Date(selectedPayment.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                {selectedPayment.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleVerify(selectedPayment)}
                      className="inline-flex items-center gap-2 px-4 h-9 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-200 text-sm font-medium rounded-lg hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      Verify
                    </button>
                    <button
                      onClick={() => handleReject(selectedPayment)}
                      className="inline-flex items-center gap-2 px-4 h-9 border border-red-200 dark:border-red-700 text-red-500 dark:text-red-200 text-sm font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowDetails(false)}
                  className="inline-flex items-center gap-2 px-4 h-9 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

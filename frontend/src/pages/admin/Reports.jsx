import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { errorAlert, toastSuccess } from "../../lib/swal";
import { useTheme } from "../../state/theme.jsx";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" integrity="sha512-2SwdPD6INVrV/lHTZbO2nodKhrnDdJK9/kg2XD1r9uGqPo1cUbujc+IYdlYdEErWNu69gVcYgdxlmVmzTWnetw==" crossorigin="anonymous" referrerpolicy="no-referrer" />

function StatCard({ title, value, subtext, icon, accentColor, mode }) {
  return (
    <div className="admin-surface border admin-border rounded-2xl shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <p className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-white">{value}</p>
          {subtext && <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{subtext}</p>}
        </div>
        <div
          className="w-11 h-11 rounded-2xl border admin-border flex items-center justify-center"
          style={{
            backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(var(--admin-primary-rgb),0.12)",
            color: accentColor,
          }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Reports() {
  const { primaryColor, mode } = useTheme();
  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;
  const [dashboard, setDashboard] = useState(null);
  const [sales, setSales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState("dashboard");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, salesRes, productsRes] = await Promise.all([
        api.get("/admin/reports/dashboard"),
        api.get(`/admin/reports/sales?period=${period}`),
        api.get("/admin/reports/top-products").catch(() => ({ data: { data: [] } })),
      ]);

      // Format dashboard data
      const dashData = dashRes.data;
      setDashboard({
        revenue: dashData.revenue || { total: 0, month: 0, today: 0 },
        orders: dashData.orders || { total: 0, pending: 0, processing: 0, completed: 0 },
        products: dashData.products || { total: 0, active: 0, low_stock: 0 },
        customers: dashData.customers || { total: 0, new_this_month: 0 },
      });

      // Format sales data
      setSales(salesRes.data?.sales || salesRes.data?.data || []);

      // Format products data
      setTopProducts(productsRes.data?.data || []);
    } catch (e) {
      console.error("Failed to load reports", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]);

  useEffect(() => {
    if (dateFrom || dateTo) return;
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    setDateFrom(toStr(firstDay));
    setDateTo(toStr(now));
  }, [dateFrom, dateTo]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!dateFrom || !dateTo) {
      await errorAlert({
        khTitle: "កាលបរិច្ឆេទមិនគ្រប់",
        enTitle: "Date range required",
        khText: "សូមជ្រើសរើសថ្ងៃចាប់ផ្ដើម និងថ្ងៃបញ្ចប់",
        enText: "Please select Date From and Date To",
      });
      return;
    }
    setGenerating(true);
    try {
      const { data } = await api.get("/admin/reports/generate", {
        params: { type: reportType, from: dateFrom, to: dateTo },
      });
      setGenerated(data?.data || null);
    } catch (e) {
      await errorAlert({
        khTitle: "បង្កើតរបាយការណ៍បរាជ័យ",
        enTitle: "Generate report failed",
        detail: e?.response?.data?.message || "Failed to generate report",
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!dateFrom || !dateTo) {
      await errorAlert({
        khTitle: "កាលបរិច្ឆេទមិនគ្រប់",
        enTitle: "Date range required",
        khText: "សូមជ្រើសរើសថ្ងៃចាប់ផ្ដើម និងថ្ងៃបញ្ចប់",
        enText: "Please select Date From and Date To",
      });
      return;
    }
    try {
      const res = await api.get("/admin/reports/download-pdf", {
        params: { type: reportType, from: dateFrom, to: dateTo },
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportType}-${dateFrom}-to-${dateTo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      await toastSuccess({ khText: "បានទាញយក PDF ដោយជោគជ័យ", enText: "PDF downloaded successfully" });
    } catch (e) {
      let message = e?.response?.data?.message;
      const data = e?.response?.data;
      if (!message && data instanceof Blob) {
        try {
          const text = await data.text();
          const json = JSON.parse(text);
          message = json?.message;
        } catch {
          message = null;
        }
      }
      await errorAlert({
        khTitle: "ទាញយក PDF បរាជ័យ",
        enTitle: "Download PDF failed",
        detail: message || "Failed to download PDF",
      });
    }
  };

  const maxRevenue = Math.max(...sales.map(s => s.revenue || 0), 1);

  return (
    <div className="min-h-full admin-soft text-slate-800 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                style={{ color: mode === "dark" ? "#0b0b0f" : "#ffffff" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </span>
            Reports & Analytics
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base md:text-lg">Track your store performance and metrics</p>
        </div>

        {loading ? (
          <AdminContentSkeleton lines={3} imageHeight={200} className="mt-4" />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Revenue"
                value={`$${(dashboard?.revenue?.total || 0).toLocaleString()}`}
                subtext={`This month: $${(dashboard?.revenue?.month || 0).toLocaleString()}`}
                icon="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                accentColor={accentColor}
                mode={mode}
              />
              <StatCard
                title="Total Orders"
                value={dashboard?.orders?.total || 0}
                subtext={`${dashboard?.orders?.pending || 0} pending`}
                icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                accentColor={accentColor}
                mode={mode}
              />
              <StatCard
                title="Products"
                value={dashboard?.products?.total || 0}
                subtext={`${dashboard?.products?.active || 0} active, ${dashboard?.products?.low_stock || 0} low stock`}
                icon="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                accentColor={accentColor}
                mode={mode}
              />
              <StatCard
                title="Customers"
                value={dashboard?.customers?.total || 0}
                subtext={`${dashboard?.customers?.new_this_month || 0} new this month`}
                icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                accentColor={accentColor}
                mode={mode}
              />
            </div>

            {/* Sales Chart */}
            <div className="admin-surface border admin-border rounded-2xl shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Sales Overview</h2>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="h-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 px-4 text-sm outline-none bg-white dark:bg-slate-700 dark:text-white"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                </select>
              </div>
              <div className="h-64 flex items-end gap-2">
                {sales.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full rounded-t-lg transition-all duration-500"
                      style={{
                        background: mode === "dark"
                          ? "linear-gradient(to top, #ffffff, #cbd5e1)"
                          : `linear-gradient(to top, ${accentColor}, rgba(var(--admin-primary-rgb),0.55))`,
                        height: `${((day.revenue || 0) / maxRevenue) * 200}px`,
                      }}
                    />
                    <span className="text-xs text-slate-400 dark:text-slate-500">{new Date(day.date).getDate()}</span>
                  </div>
                ))}
              </div>
              {sales.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400 py-12">No sales data for this period</p>
              )}
            </div>

            {/* Top Products */}
            <div className="admin-surface border admin-border rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Top Selling Products</h2>
              {topProducts.length === 0 ? (
                <p className="text-center text-slate-500 dark:text-slate-400 py-12">No products sold yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                        <th className="pb-4 font-medium">Product</th>
                        <th className="pb-4 font-medium text-right">Units Sold</th>
                        <th className="pb-4 font-medium text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((item, i) => (
                        <tr key={item.product_id} className="border-b border-slate-50 dark:border-slate-700">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                                {item.product?.image_url && (
                                  <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />
                                )}
                              </div>
                              <span className="font-medium text-slate-800 dark:text-white">{item.product?.name || `Product #${item.product_id}`}</span>
                            </div>
                          </td>
                          <td className="py-4 text-right font-semibold text-slate-800 dark:text-white">{item.total_sold}</td>
                          <td className="py-4 text-right font-semibold" style={{ color: accentColor }}>${item.total_revenue?.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Report Generator */}
            <div className="admin-surface border admin-border rounded-2xl shadow-sm p-6 mt-8">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Generate Report</h2>
              <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Report Type</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 px-4 text-sm outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white dark:[color-scheme:dark]"
                  >
                    <option value="dashboard">Dashboard Summary</option>
                    <option value="sales">Sales Report</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date From</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 px-4 text-sm outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white dark:[color-scheme:dark]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date To</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full h-10 rounded-xl border-2 border-slate-200 dark:border-slate-600 px-4 text-sm outline-none bg-white dark:bg-slate-700 text-slate-800 dark:text-white dark:[color-scheme:dark]"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <button
                    type="submit"
                    disabled={generating}
                    className="h-11 px-5 rounded-full flex items-center justify-center gap-2 text-sm font-semibold text-white shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: accentColor,
                      color: mode === "dark" ? "#0b0b0f" : "#ffffff",
                      border: `1px solid ${accentColor}`,
                      boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
                    }}
                  >
                    {generating ? (
                      "Generating..."
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l1.4 3.6 3.6 1.4-3.6 1.4L12 14l-1.4-3.6L7 9l3.6-1.4z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16.5l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8L3.4 19l1.8-.8zM17 16.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" />
                        </svg>
                        <span>Generate</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="h-11 w-11 rounded-xl flex items-center justify-center border shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    style={{
                      backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "transparent",
                      color: accentColor,
                      borderColor: accentColor,
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v9m0 0l-3-3m3 3l3-3" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18h12" />
                    </svg>
                    <span className="sr-only">Download PDF</span>
                  </button>
                </div>
              </form>

              {generated && (
                <div
                  className="mt-6 p-4 rounded-xl"
                  style={{
                    backgroundColor: mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(var(--admin-primary-rgb),0.10)",
                    border: mode === "dark" ? `1px solid ${accentColor}` : "1px solid rgba(var(--admin-primary-rgb),0.25)",
                  }}
                >
                  <div className="text-sm font-semibold" style={{ color: accentColor }}>Generated</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    {generated.type === "dashboard" && (
                      <>
                        Dashboard Summary from {generated.from} to {generated.to}. Revenue in range: ${Number(generated.revenue?.total || 0).toFixed(2)}. Total Orders in range: {generated.orders?.total || 0} ({generated.orders?.pending || 0} pending). Products: {generated.products?.total || 0} ({generated.products?.active || 0} active, {generated.products?.low_stock || 0} low stock). Customers: {generated.customers?.total || 0} ({generated.customers?.new_this_month || 0} new in range).
                      </>
                    )}
                    {generated.type === "sales" && (
                      <>
                        Sales Report from {generated.from} to {generated.to}. Total Orders: {generated.summary?.total_orders}, Total Revenue: ${Number(generated.summary?.total_revenue || 0).toFixed(2)}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}


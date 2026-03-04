import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../../lib/api";
import { closeSwal, errorAlert, loadingAlert, toastSuccess } from "../../lib/swal";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";
import { useTheme } from "../../state/theme.jsx";

export default function AdminShipments() {
  const { primaryColor, mode } = useTheme();
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [createForm, setCreateForm] = useState({ order_id: "", provider: "", tracking_number: "" });
  const [creating, setCreating] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    provider: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showStatusForm, setShowStatusForm] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [search, setSearch] = useState("");
  const [qrImageUrl, setQrImageUrl] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [trackingCopy, setTrackingCopy] = useState(false);
  const [driverEmail, setDriverEmail] = useState("");
  const [driverPassword, setDriverPassword] = useState("");
  const [driverOtp, setDriverOtp] = useState("");
  const [driverToken, setDriverToken] = useState("");
  const [driverAuthToken, setDriverAuthToken] = useState("");
  const [driverStep, setDriverStep] = useState("login");
  const [driverLoading, setDriverLoading] = useState(false);
  const [driverError, setDriverError] = useState("");

  const driverTokenStorageKey = "fs_driver_token";
  const driverTokenTtlMs = 24 * 60 * 60 * 1000;

  const rawDriverBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const driverBaseUrl = rawDriverBaseUrl.replace(/\/$/, "").endsWith("/api")
    ? rawDriverBaseUrl.replace(/\/$/, "")
    : `${rawDriverBaseUrl.replace(/\/$/, "")}/api`;
  const driverApi = axios.create({
    baseURL: driverBaseUrl,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const saveDriverToken = (token) => {
    const payload = {
      token,
      expires_at: Date.now() + driverTokenTtlMs,
    };
    localStorage.setItem(driverTokenStorageKey, JSON.stringify(payload));
  };

  const loadDriverToken = () => {
    const raw = localStorage.getItem(driverTokenStorageKey);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.token || !parsed?.expires_at) return null;
      if (Date.now() > parsed.expires_at) {
        localStorage.removeItem(driverTokenStorageKey);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };

  const revokeDriverToken = () => {
    localStorage.removeItem(driverTokenStorageKey);
    setDriverToken("");
    setDriverAuthToken("");
    setDriverStep("login");
  };

  const loadShipments = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.provider !== "all") params.append("provider", filters.provider);
      params.append("page", page);
      params.append("per_page", 15);

      const { data } = await api.get(`/admin/shipments?${params}`);
      setShipments(data.data.data || []);
      setTotalPages(data.data.last_page || 1);
      setCurrentPage(page);
    } catch (e) {
      console.error("Failed to load shipments", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShipments(1);
  }, [filters]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/admin/shipments/providers");
        const list = data?.data || [];
        setProviders(list);
        if (list.length && !createForm.provider) {
          setCreateForm((s) => ({ ...s, provider: list[0] }));
        }
      } catch (e) {
        console.error("Failed to load providers", e);
      }
    })();
  }, []);

  useEffect(() => {
    const stored = loadDriverToken();
    if (stored?.token) {
      setDriverToken(stored.token);
      setDriverStep("token");
    }
  }, []);

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    if (!createForm.order_id || !createForm.provider || !createForm.tracking_number) {
      await errorAlert({
        khTitle: "ទិន្នន័យមិនគ្រប់",
        enTitle: "Missing fields",
        khText: "សូមបំពេញគ្រប់ព័ត៌មាន",
        enText: "Please fill all fields",
      });
      return;
    }
    setCreating(true);
    loadingAlert({ khTitle: "កំពុងបង្កើតការដឹកជញ្ជូន", enTitle: "Creating shipment" });
    try {
      await api.post("/admin/shipments", {
        order_id: Number(createForm.order_id),
        provider: createForm.provider,
        tracking_code: createForm.tracking_number,
      });
      setCreateForm((s) => ({ ...s, order_id: "", tracking_number: "" }));
      await loadShipments(1);
      closeSwal();
      await toastSuccess({ khText: "បានបង្កើតការដឹកជញ្ជូនដោយជោគជ័យ", enText: "Shipment created" });
    } catch (e) {
      closeSwal();
      await errorAlert({
        khTitle: "បង្កើតការដឹកជញ្ជូនបរាជ័យ",
        enTitle: "Create shipment failed",
        detail: "Failed to create shipment: " + (e.response?.data?.message || e.message),
      });
    } finally {
      closeSwal();
      setCreating(false);
    }
  };

  const clearQrImage = () => {
    if (qrImageUrl) {
      URL.revokeObjectURL(qrImageUrl);
    }
    setQrImageUrl("");
    setQrLoading(false);
  };

  const fetchQrImage = async (shipmentId) => {
    if (!shipmentId) return;
    clearQrImage();
    setQrLoading(true);
    try {
      const response = await api.get(`/admin/shipments/${shipmentId}/qr`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      setQrImageUrl(url);
    } catch (e) {
      console.error("Failed to load QR image", e);
      setQrImageUrl("");
    } finally {
      setQrLoading(false);
    }
  };

  if (loading) return <AdminContentSkeleton title="Shipments" />;

  const downloadQrImage = () => {
    if (!qrImageUrl || !selectedShipment?.id) return;

    const link = document.createElement("a");
    link.href = qrImageUrl;
    link.download = `shipment-${selectedShipment.id}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = async (value, onDone) => {
    try {
      await navigator.clipboard.writeText(value);
      onDone(true);
      setTimeout(() => onDone(false), 1200);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleDriverLogin = async (e) => {
    e.preventDefault();
    setDriverLoading(true);
    setDriverError("");
    try {
      const { data } = await driverApi.post("/auth/login", {
        email: driverEmail,
        password: driverPassword,
      });

      if (!data?.otp_required) {
        setDriverError("OTP required for driver login.");
        return;
      }

      setDriverStep("otp");
    } catch (e) {
      setDriverError(e.response?.data?.message || "Failed to send OTP.");
    } finally {
      setDriverLoading(false);
    }
  };

  const handleDriverVerify = async (e) => {
    e.preventDefault();
    setDriverLoading(true);
    setDriverError("");
    try {
      const { data } = await driverApi.post("/auth/otp/verify", {
        email: driverEmail,
        code: driverOtp,
        purpose: "login",
      });

      const token = data?.token;
      if (!token) {
        setDriverError("No auth token returned.");
        return;
      }

      setDriverAuthToken(token);

      const driverTokenResp = await driverApi.post(
        "/auth/driver/token",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDriverToken(driverTokenResp?.data?.token || "");
      setDriverStep("token");
    } catch (e) {
      setDriverError(e.response?.data?.message || "OTP verification failed.");
    } finally {
      setDriverLoading(false);
    }
  };

  const resetDriverFlow = () => {
    setDriverOtp("");
    setDriverToken("");
    setDriverAuthToken("");
    setDriverStep("login");
    setDriverError("");
  };

  const showShipmentDetails = async (shipment) => {
    try {
      const { data } = await api.get(
        `/admin/shipments/order/${shipment.order_id}`
      );
      setSelectedShipment(data.data);
      setShowDetails(true);
      fetchQrImage(data.data?.id);
    } catch (e) {
      console.error("Failed to fetch shipment details", e);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) {
      await errorAlert({
        khTitle: "សូមជ្រើសស្ថានភាព",
        enTitle: "Select status",
        khText: "សូមជ្រើសស្ថានភាពមុនបន្ត",
        enText: "Please select a status",
      });
      return;
    }

    try {
      await api.patch(
        `/admin/shipments/${selectedShipment.id}/status`,
        { status: newStatus }
      );
      setShowStatusForm(false);
      setNewStatus("");
      loadShipments(currentPage);
      // Refresh details
      const { data } = await api.get(
        `/admin/shipments/order/${selectedShipment.order_id}`
      );
      setSelectedShipment(data.data);
    } catch (e) {
      console.error("Failed to update shipment status", e);
      await errorAlert({
        khTitle: "កែស្ថានភាពបរាជ័យ",
        enTitle: "Status update failed",
        detail: "Failed to update status: " + (e.response?.data?.message || e.message),
      });
    }
  };

  const handleAddTracking = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const trackingData = {
      status: formData.get("tracking_status"),
      location: formData.get("location"),
      description: formData.get("description"),
    };

    try {
      await api.post(
        `/admin/shipments/${selectedShipment.id}/tracking-events`,
        trackingData
      );
      e.target.reset();
      // Refresh details
      const { data } = await api.get(
        `/admin/shipments/order/${selectedShipment.order_id}`
      );
      setSelectedShipment(data.data);
    } catch (e) {
      console.error("Failed to add tracking event", e);
      await errorAlert({
        khTitle: "បន្ថែម Tracking បរាជ័យ",
        enTitle: "Add tracking failed",
        detail: "Failed to add tracking: " + (e.response?.data?.message || e.message),
      });
    }
  };

  const isDark = mode === "dark";

  const getStatusBadgeStyle = (status) => {
    const palette = {
      pending: {
        lightBg: "#FEF3C7",
        lightText: "#92400E",
        lightBorder: "#F59E0B",
        darkBg: "rgba(217, 119, 6, 0.2)",
        darkText: "#FCD34D",
        darkBorder: "rgba(252, 211, 77, 0.35)",
      },
      processing: {
        lightBg: "#DBEAFE",
        lightText: "#1D4ED8",
        lightBorder: "#93C5FD",
        darkBg: "rgba(96, 165, 250, 0.2)",
        darkText: "#BFDBFE",
        darkBorder: "rgba(191, 219, 254, 0.35)",
      },
      shipped: {
        lightBg: "#F3E8FF",
        lightText: "#6B21A8",
        lightBorder: "#C084FC",
        darkBg: "rgba(192, 132, 252, 0.2)",
        darkText: "#E9D5FF",
        darkBorder: "rgba(233, 213, 255, 0.35)",
      },
      in_transit: {
        lightBg: "#ECFEFF",
        lightText: "#0F766E",
        lightBorder: "#67E8F9",
        darkBg: "rgba(34, 211, 238, 0.18)",
        darkText: "#99F6E4",
        darkBorder: "rgba(153, 246, 228, 0.4)",
      },
      delivered: {
        lightBg: "#DCFCE7",
        lightText: "#166534",
        lightBorder: "#86EFAC",
        darkBg: "rgba(74, 222, 128, 0.2)",
        darkText: "#BBF7D0",
        darkBorder: "rgba(187, 247, 208, 0.4)",
      },
      failed: {
        lightBg: "#FEE2E2",
        lightText: "#991B1B",
        lightBorder: "#FCA5A5",
        darkBg: "rgba(248, 113, 113, 0.22)",
        darkText: "#FECACA",
        darkBorder: "rgba(254, 202, 202, 0.4)",
      },
      returned: {
        lightBg: "#FFECDD",
        lightText: "#9A3412",
        lightBorder: "#FDBA74",
        darkBg: "rgba(253, 186, 116, 0.2)",
        darkText: "#FED7AA",
        darkBorder: "rgba(254, 215, 170, 0.4)",
      },
      default: {
        lightBg: "#E2E8F0",
        lightText: "#0F172A",
        lightBorder: "#CBD5E1",
        darkBg: "rgba(148, 163, 184, 0.25)",
        darkText: "#E2E8F0",
        darkBorder: "rgba(226, 232, 240, 0.35)",
      },
    };

    const colors = palette[status] || palette.default;

    return {
      backgroundColor: isDark ? colors.darkBg : colors.lightBg,
      color: isDark ? colors.darkText : colors.lightText,
      border: `1px solid ${isDark ? colors.darkBorder : colors.lightBorder}`,
      textTransform: "capitalize",
    };
  };

  const filteredShipments = shipments.filter((shipment) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      String(shipment.tracking_number || "").toLowerCase().includes(q) ||
      String(shipment.tracking_code || "").toLowerCase().includes(q) ||
      String(shipment.order?.order_number || "").toLowerCase().includes(q) ||
      String(shipment.provider || "").toLowerCase().includes(q) ||
      String(shipment.status || "").toLowerCase().includes(q)
    );
  });

  const trackingUrl = selectedShipment
    ? `${window.location.origin}/track-order?shipment_id=${selectedShipment.id}&tracking_code=${selectedShipment.tracking_code || selectedShipment.tracking_number || ""}`
    : "";

  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;

  return (
    <div className="min-h-screen admin-soft text-slate-800 dark:text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 dark:text-slate-100">
            Shipments Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Track and manage all shipments
          </p>
        </div>

        {/* Filters */}
        <div className="admin-surface border admin-border rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:outline-none dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="failed">Failed</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                Provider
              </label>
              <select
                value={filters.provider}
                onChange={(e) =>
                  setFilters({ ...filters, provider: e.target.value })
                }
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:outline-none dark:text-slate-100"
              >
                <option value="all">All Providers</option>
                {(providers.length ? providers : ["Standard", "Express", "Overnight"]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    status: "all",
                    provider: "all",
                  })
                }
                className="w-full px-4 py-2 border admin-border rounded-lg text-slate-800 bg-transparent hover:bg-slate-100 transition dark:text-slate-100 dark:hover:bg-white/5"
              >
                Reset
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shipments..."
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Driver Token */}
        <div className="admin-surface border admin-border rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 dark:text-slate-100">Driver Token</h3>
          <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">
            Generate a driver token using driver credentials and OTP.
          </p>

          {driverError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-400/60 dark:bg-red-900/30 dark:text-red-200">
              {driverError}
            </div>
          )}

          {driverStep === "login" && (
            <form onSubmit={handleDriverLogin} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                  Driver Email
                </label>
                <input
                  type="email"
                  value={driverEmail}
                  onChange={(e) => setDriverEmail(e.target.value)}
                  className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                  placeholder="driver@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                  Password
                </label>
                <input
                  type="password"
                  value={driverPassword}
                  onChange={(e) => setDriverPassword(e.target.value)}
                  className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={driverLoading}
                  className="w-full px-4 py-2 rounded-lg bg-[var(--admin-primary)] text-slate-900 font-semibold hover:brightness-95 disabled:opacity-50"
                >
                  {driverLoading ? "Sending OTP..." : "Send OTP"}
                </button>
              </div>
            </form>
          )}

          {driverStep === "otp" && (
            <form onSubmit={handleDriverVerify} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={driverOtp}
                  onChange={(e) => setDriverOtp(e.target.value)}
                  className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                  placeholder="123456"
                  required
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  disabled={driverLoading}
                  className="px-4 py-2 rounded-lg bg-[var(--admin-primary)] text-slate-900 font-semibold hover:brightness-95 disabled:opacity-50"
                >
                  {driverLoading ? "Verifying..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  onClick={resetDriverFlow}
                  className="px-4 py-2 border admin-border text-slate-800 rounded-lg hover:bg-slate-100 transition dark:text-slate-100 dark:hover:bg-white/5"
                >
                  Reset
                </button>
              </div>
            </form>
          )}

          {driverStep === "token" && (
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1">
                <p className="text-sm text-slate-500 mb-1 dark:text-slate-400">Driver Token</p>
                <p className="text-sm font-mono text-slate-900 break-all dark:text-slate-100">
                  {driverToken || "Token not generated"}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(driverToken, setCopyStatus)}
                  className="px-3 py-2 border admin-border text-slate-800 rounded hover:bg-slate-100 transition text-sm font-medium dark:text-slate-100 dark:hover:bg-white/5"
                  disabled={!driverToken}
                >
                  {copyStatus ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={resetDriverFlow}
                  className="px-3 py-2 border admin-border text-slate-800 rounded hover:bg-slate-100 transition text-sm font-medium dark:text-slate-100 dark:hover:bg-white/5"
                >
                  New Token
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Create Shipment */}
        <div className="admin-surface border admin-border rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 dark:text-slate-100">Create Shipment</h3>
          <form onSubmit={handleCreateShipment} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                Order ID
              </label>
              <input
                type="number"
                value={createForm.order_id}
                onChange={(e) => setCreateForm((s) => ({ ...s, order_id: e.target.value }))}
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="e.g. 123"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                Provider
              </label>
              <select
                value={createForm.provider}
                onChange={(e) => setCreateForm((s) => ({ ...s, provider: e.target.value }))}
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
              >
                <option value="">Select provider</option>
                {(providers.length ? providers : ["Standard", "Express", "Overnight"]).map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2 dark:text-slate-300">
                Tracking Number
              </label>
              <input
                type="text"
                value={createForm.tracking_number}
                onChange={(e) => setCreateForm((s) => ({ ...s, tracking_number: e.target.value }))}
                className="w-full px-4 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                placeholder="e.g. TRK-000123"
              />
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-lg bg-[var(--admin-primary)] text-slate-900 font-semibold hover:brightness-95 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Shipment"}
              </button>
            </div>
          </form>
        </div>

        {/* Loading */}
        {loading && <AdminSectionLoader rows={6} />}

        {/* Shipments Table */}
        {!loading && (
          <div className="admin-surface border admin-border rounded-xl overflow-hidden">
            {filteredShipments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">
                  No shipments found
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="admin-soft border-b admin-border">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Tracking #
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Shipped Date
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredShipments.map((shipment) => (
                        <tr
                          key={shipment.id}
                          className="hover:bg-slate-50 transition dark:hover:bg-slate-800"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {shipment.tracking_number || shipment.tracking_code || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                            {shipment.order?.order_number || "N/A"}
                          </td>
                          <td className="px-6 py-4 text-sm capitalize text-slate-900 dark:text-slate-100">
                            {shipment.provider}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium inline-flex items-center"
                              style={getStatusBadgeStyle(shipment.status)}
                            >
                              {shipment.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300">
                            {shipment.shipped_at
                              ? new Date(shipment.shipped_at).toLocaleDateString()
                              : "Not shipped"}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <button
                              onClick={() => showShipmentDetails(shipment)}
                              className="h-9 w-9 border admin-border text-slate-200 hover:bg-white/5 rounded-lg inline-flex items-center justify-center"
                              title="Manage"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t admin-border flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-sm text-slate-500 shrink-0 dark:text-slate-300">
                      Page <span className="font-medium text-slate-700 dark:text-slate-100">{currentPage}</span> of <span className="font-medium text-slate-700 dark:text-slate-100">{totalPages}</span>
                    </p>

                    <div className="inline-flex items-center gap-1">
                      {/* First */}
                      <button
                        onClick={() => loadShipments(1)}
                        disabled={currentPage === 1}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border admin-border text-slate-300 hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition text-xs"
                        title="First page"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
                      </button>

                      {/* Prev */}
                      <button
                        onClick={() => loadShipments(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border admin-border text-slate-300 hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition"
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
                            <span key={"dot-" + idx} className="h-9 w-9 flex items-center justify-center text-sm text-slate-500 select-none">…</span>
                          ) : (
                            <button
                              key={item}
                              onClick={() => loadShipments(item)}
                              className={"h-9 w-9 flex items-center justify-center rounded-lg text-sm font-medium transition " + (currentPage === item
                                ? "bg-[var(--admin-primary)] text-slate-900 shadow-sm"
                                : "border admin-border text-slate-200 hover:bg-white/5"
                              )}
                            >
                              {item}
                            </button>
                          )
                        );
                      })()}

                      {/* Next */}
                      <button
                        onClick={() => loadShipments(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border admin-border text-slate-300 hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition"
                        title="Next page"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>

                      {/* Last */}
                      <button
                        onClick={() => loadShipments(totalPages)}
                        disabled={currentPage === totalPages}
                        className="h-9 w-9 flex items-center justify-center rounded-lg border admin-border text-slate-300 hover:bg-white/5 disabled:opacity-35 disabled:cursor-not-allowed transition text-xs"
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

        {/* Shipment Details Modal */}
        {showDetails && selectedShipment && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-auto">
            <div className="admin-surface border admin-border rounded-xl shadow-2xl max-w-2xl w-full my-8">
              <div className="p-6 border-b admin-border">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Shipment Details
                  </h3>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setShowStatusForm(false);
                      clearQrImage();
                    }}
                    className="text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Tracking Number
                    </p>
                    <p className="text-lg font-mono font-semibold text-slate-900 break-all dark:text-slate-100">
                      {selectedShipment.tracking_number || selectedShipment.tracking_code || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Provider
                    </p>
                    <p className="text-lg font-semibold text-slate-900 capitalize dark:text-slate-100">
                      {selectedShipment.provider}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Status
                    </p>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center"
                      style={getStatusBadgeStyle(selectedShipment.status)}
                    >
                      {selectedShipment.status.replace("_", " ")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Shipped Date
                    </p>
                    <p className="text-sm text-slate-900 dark:text-slate-100">
                      {selectedShipment.shipped_at
                        ? new Date(
                          selectedShipment.shipped_at
                        ).toLocaleString()
                        : "Not shipped"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 rounded-lg border admin-border p-4 admin-soft">
                  <div className="w-32 h-32 admin-soft rounded-lg flex items-center justify-center">
                    {qrLoading ? (
                      <span className="text-xs text-slate-500 dark:text-slate-400">Loading QR...</span>
                    ) : qrImageUrl ? (
                      <img
                        src={qrImageUrl}
                        alt="Shipment QR"
                        className="w-28 h-28 object-contain"
                      />
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">QR unavailable</span>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={downloadQrImage}
                      disabled={!qrImageUrl}
                      className="mt-2 px-3 py-1.5 rounded-md text-xs font-semibold border admin-border text-slate-800 hover:bg-slate-100 disabled:opacity-50 dark:text-slate-100 dark:hover:bg-white/5"
                    >
                      Download QR
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400">Tracking URL</p>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(trackingUrl, setTrackingCopy)}
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border admin-border text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-white/5"
                        disabled={!trackingUrl}
                      >
                        {trackingCopy ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-sm text-slate-900 break-all font-mono mt-1 dark:text-slate-100">
                      {trackingUrl}
                    </p>
                  </div>
                </div>

                {/* Tracking Events */}
                {((selectedShipment.tracking_events || selectedShipment.trackingEvents) || []).length > 0 && (
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-3 dark:text-slate-100">
                      Tracking History
                    </h4>
                    <div className="space-y-2">
                      {(selectedShipment.tracking_events || selectedShipment.trackingEvents).map((event, idx) => (
                        <div
                          key={idx}
                          className="p-3 admin-soft rounded-lg"
                        >
                          <p className="text-sm font-medium text-slate-900 capitalize dark:text-slate-100">
                            {event.status?.replace("_", " ")}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {event.location}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {event.description || event.note}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {new Date(event.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Update Status Form */}
                {showStatusForm && (
                  <form
                    onSubmit={handleUpdateStatus}
                    className="p-4 admin-soft border admin-border rounded-lg"
                  >
                    <h4 className="font-semibold text-slate-900 mb-3 dark:text-slate-100">
                      Update Status
                    </h4>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none mb-3 text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select new status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                      <option value="failed">Failed</option>
                      <option value="returned">Returned</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-2 rounded bg-[var(--admin-primary)] text-slate-900 transition font-semibold text-sm hover:brightness-95"
                      >
                        Update
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowStatusForm(false);
                          setNewStatus("");
                        }}
                        className="flex-1 px-3 py-2 border admin-border text-slate-800 rounded hover:bg-slate-100 transition font-semibold text-sm dark:text-slate-100 dark:hover:bg-white/5"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Add Tracking Event Form */}
                <form onSubmit={handleAddTracking} className="p-4 admin-soft border admin-border rounded-lg">
                  <h4 className="font-semibold text-slate-900 mb-3 dark:text-slate-100">
                    Add Tracking Event
                  </h4>
                  <div className="space-y-3">
                    <select
                      name="tracking_status"
                      required
                      className="w-full px-3 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                    >
                      <option value="">Select tracking status</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="in_transit">In Transit</option>
                      <option value="delivered">Delivered</option>
                    </select>
                    <input
                      type="text"
                      name="location"
                      placeholder="Location"
                      className="w-full px-3 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                    />
                    <textarea
                      name="description"
                      placeholder="Description"
                      className="w-full px-3 py-2 border admin-border admin-surface rounded-lg focus:border-[var(--admin-primary)] focus:ring-2 focus:ring-[var(--admin-primary)]/30 focus:outline-none text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      className="w-full px-3 py-2 rounded bg-[var(--admin-primary)] text-slate-900 hover:brightness-95 transition font-semibold"
                    >
                      Add Event
                    </button>
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t admin-border flex justify-end gap-3">
                {!showStatusForm && (
                  <button
                    onClick={() => setShowStatusForm(true)}
                    className="px-4 py-2 rounded-lg bg-[var(--admin-primary)] text-slate-900 hover:brightness-95 transition font-semibold"
                  >
                    Update Status
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDetails(false);
                    setShowStatusForm(false);
                    clearQrImage();
                  }}
                  className="px-4 py-2 border admin-border text-slate-800 rounded-lg hover:bg-slate-100 transition font-semibold dark:text-slate-100 dark:hover:bg-white/5"
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

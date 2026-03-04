import React, { useEffect, useState } from "react";
import api from "../lib/api";
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../components/ui/Dialog";
import { useLanguage } from "../lib/i18n.jsx";

export default function TrackOrderPage() {
  const { t } = useLanguage();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [trackMode, setTrackMode] = useState("order");
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [shipmentId, setShipmentId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoRunLoading, setAutoRunLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [shipment, setShipment] = useState(null);
  const [error, setError] = useState("");

  const runSearch = async ({
    mode,
    orderIdValue,
    shipmentIdValue,
    trackingCodeValue,
  }) => {
    setError("");
    setOrder(null);
    setShipment(null);

    if (mode === "shipment") {
      if (!shipmentIdValue.trim() || !trackingCodeValue.trim()) {
        setError("Shipment ID and tracking code are required.");
        return;
      }
    } else if (!orderIdValue.trim()) {
      setError(t('orderIdRequired'));
      return;
    }

    setLoading(true);

    try {
      if (mode === "shipment") {
        const { data } = await api.get("/shipments/track", {
          params: {
            shipment_id: shipmentIdValue.trim(),
            tracking_code: trackingCodeValue.trim(),
          },
        });
        setShipment(data.data);
      } else {
        const { data } = await api.get(`/orders/${orderIdValue}/track`);
        setOrder(data.order);
      }
    } catch (e) {
      setError(e.response?.data?.message || t('orderNotFound'));
    } finally {
      setLoading(false);
      setAutoRunLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await runSearch({
      mode: trackMode,
      orderIdValue: orderId,
      shipmentIdValue: shipmentId,
      trackingCodeValue: trackingCode,
    });
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shipmentParam = params.get("shipment_id");
    const trackingParam = params.get("tracking_code");

    if (shipmentParam && trackingParam) {
      setTrackMode("shipment");
      setShipmentId(shipmentParam);
      setTrackingCode(trackingParam);
      setIsFormOpen(false);
      setAutoRunLoading(true);
      runSearch({
        mode: "shipment",
        shipmentIdValue: shipmentParam,
        trackingCodeValue: trackingParam,
        orderIdValue: "",
      });
    }
  }, []);

  const getStatusStep = (status) => {
    const steps = {
      pending: 0,
      confirmed: 1,
      processing: 2,
      shipped: 3,
      delivered: 4,
    };
    return steps[status?.toLowerCase()] || 0;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500",
      confirmed: "bg-blue-500",
      processing: "bg-indigo-500",
      shipped: "bg-purple-500",
      delivered: "bg-emerald-500",
    };
    return colors[status?.toLowerCase()] || "bg-slate-500";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </span>
            {t('trackYourOrder')}
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400">{t('trackOrderSubtitle')}</p>
        </div>

        {autoRunLoading && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Auto tracking from QR code. Please wait...
          </div>
        )}

        {/* Search Form - CTA Button */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('searchOrder')}
            </h2>
            <p className="text-emerald-100 text-sm">{t('searchOrderSubtitle')}</p>
          </div>
          
          <div className="p-6 text-center">
            <button
              onClick={() => setIsFormOpen(true)}
              className="px-8 sm:px-10 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-base sm:text-lg font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {t('trackOrder')}
            </button>
          </div>
        </div>

        {/* Alert Dialog Form */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogPopup className="w-[95vw] max-w-[450px] p-0" from="top" position="center" showCloseButton={true}>
            <div className="px-6 pt-6 flex items-start justify-between mb-6">
              <div className="flex-1">
                <DialogTitle className="text-2xl font-black">{t('trackYourOrder')}</DialogTitle>
                <DialogDescription className="mt-2">
                  {t('trackOrderDialogDesc')}
                </DialogDescription>
              </div>
            </div>

            <div className="px-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSearch} className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTrackMode("order")}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      trackMode === "order"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Track by Order
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrackMode("shipment")}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-all ${
                      trackMode === "shipment"
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    Track by Shipment
                  </button>
                </div>

                {trackMode === "shipment" ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Shipment ID</label>
                      <input
                        type="text"
                        value={shipmentId}
                        onChange={(e) => setShipmentId(e.target.value)}
                        placeholder="e.g. 123"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Tracking Code</label>
                      <input
                        type="text"
                        value={trackingCode}
                        onChange={(e) => setTrackingCode(e.target.value)}
                        placeholder="FS-20260217123000-ABC123"
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </>
                ) : (
                  <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('orderId')}</label>
                  <input
                    type="text"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder={t('orderIdPlaceholder')}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('emailOptional')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                </div>
                  </>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-base transition-all duration-300"
                  >
                    {loading ? t('searching') : t('trackOrder')}
                  </button>
                  <DialogClose
                    onClick={() => setIsFormOpen(false)}
                    className="flex-1 border border-gray-300 bg-white text-gray-900 font-semibold py-3 rounded-lg text-base hover:bg-gray-50 transition-all duration-300"
                  >
                    {t('cancel')}
                  </DialogClose>
                </div>
              </form>
            </div>
          </DialogPopup>
        </Dialog>

        {/* Order Details - Admin Style */}
        {order && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            {/* Order Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('orderId')}</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{order.id}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getStatusColor(order.status)}`}>
                {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
              </div>
            </div>

            {/* Progress Steps */}
            <div className="p-6">
              <div className="relative">
                <div className="flex items-center justify-between">
                  {[t('statusPending'), t('statusConfirmed'), t('statusProcessing'), t('statusShipped'), t('statusDelivered')].map((step, idx) => (
                    <div key={idx} className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm transition-all ${
                          getStatusStep(order.status) >= idx
                            ? getStatusColor(step.toLowerCase())
                            : "bg-slate-200 dark:bg-slate-600 text-slate-400"
                        }`}
                      >
                        {getStatusStep(order.status) > idx ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          idx + 1
                        )}
                      </div>
                      <span className={`mt-2 text-xs font-medium ${getStatusStep(order.status) >= idx ? "text-slate-800 dark:text-white" : "text-slate-400"}`}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-600 -z-10">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(getStatusStep(order.status) / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Order Info */}
            <div className="border-t border-slate-100 dark:border-slate-700">
              <div className="p-6 grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('orderDate')}</p>
                  <p className="font-medium text-slate-800 dark:text-white">{formatDate(order.created_at)}</p>
                </div>
                {order.tracking_number && (
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('trackingNumber')}</p>
                    <p className="font-medium text-slate-800 dark:text-white font-mono">{order.tracking_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('shippingTo')}</p>
                  <p className="font-medium text-slate-800 dark:text-white">{order.shipping_address}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{t('total')}</p>
                  <p className="font-bold text-lg text-slate-800 dark:text-white">${order.total}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 pb-6">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('items')}</p>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <img
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800 dark:text-white">{item.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Qty: {item.quantity} × ${item.price}</p>
                      </div>
                      <p className="font-semibold text-slate-800 dark:text-white">${item.subtotal}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {shipment && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Shipment ID</p>
                <p className="text-lg font-bold text-slate-800 dark:text-white">{shipment.shipment_id}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold text-white ${getStatusColor(shipment.status)}`}>
                {shipment.status?.charAt(0).toUpperCase() + shipment.status?.slice(1)}
              </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Provider</p>
                <p className="font-medium text-slate-800 dark:text-white">{shipment.provider || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Tracking Code</p>
                <p className="font-medium text-slate-800 dark:text-white font-mono">{shipment.tracking_code}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Shipped At</p>
                <p className="font-medium text-slate-800 dark:text-white">{formatDate(shipment.shipped_at)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Delivered At</p>
                <p className="font-medium text-slate-800 dark:text-white">{formatDate(shipment.delivered_at)}</p>
              </div>
            </div>

            {Array.isArray(shipment.tracking_events) && shipment.tracking_events.length > 0 && (
              <div className="px-6 pb-6">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Tracking History</p>
                <div className="space-y-3">
                  {shipment.tracking_events.map((event) => (
                    <div key={event.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                      <p className="font-medium text-slate-800 dark:text-white capitalize">
                        {event.status?.replace("_", " ")}
                      </p>
                      {event.location && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{event.location}</p>
                      )}
                      {event.note && (
                        <p className="text-sm text-slate-500 dark:text-slate-400">{event.note}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {formatDate(event.event_time || event.created_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Text */}
        {!order && !loading && (
          <div className="text-center text-slate-500 dark:text-slate-400">
            <p>Can't find your order? <a href="/contact" className="text-emerald-600 hover:underline">Contact us</a></p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.3s ease-out; }
      `}</style>
    </div>
  );
}


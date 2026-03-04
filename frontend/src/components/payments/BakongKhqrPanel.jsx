import { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode.react";
import { Clock3, Copy, RefreshCcw, ShieldCheck, Smartphone } from "lucide-react";
import api from "../../lib/api";

const POLL_INTERVAL = 2500;

const pickStatus = (payload) => payload?.payment?.status || payload?.status || null;

export default function BakongKhqrPanel({ orderId, amount, currency = "KHR", onStatusChange }) {
  const [payment, setPayment] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const expiresTimestamp = useMemo(() => {
    if (!payment?.expires_at) return null;
    return new Date(payment.expires_at).getTime();
  }, [payment]);

  const notify = useCallback(
    (nextStatus) => {
      if (typeof onStatusChange === "function") {
        onStatusChange(nextStatus);
      }
    },
    [onStatusChange]
  );

  const hydrate = useCallback(async () => {
    setRefreshing(true);
    setError(null);

    try {
      const { data } = await api.post("/payments/bakong/create", { order_id: orderId });
      const nextPayment = data?.payment || data;
      const nextStatus = pickStatus(data) || "pending";
      setPayment(nextPayment);
      setPaymentId(nextPayment?.payment_id || nextPayment?.id);
      setStatus(nextStatus);
      notify(nextStatus);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to create Bakong payment.");
      setStatus("error");
      notify("error");
    } finally {
      setRefreshing(false);
    }
  }, [notify, orderId]);

  // If backend already returns paid/expired, sync status immediately
  useEffect(() => {
    if (payment?.status && payment.status !== status) {
      setStatus(payment.status);
      if (payment.status === "paid") notify("paid");
      if (payment.status === "expired") notify("expired");
    }
  }, [payment?.status, notify, status]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!expiresTimestamp || status !== "pending") {
      return undefined;
    }

    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((expiresTimestamp - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        setStatus("expired");
        notify("expired");
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [expiresTimestamp, notify, status]);

  useEffect(() => {
    const targetId = paymentId || orderId;

    if (!payment || status !== "pending" || !targetId) {
      return undefined;
    }

    const poller = setInterval(async () => {
      try {
        const { data } = await api.get(`/payments/bakong/status/${targetId}`);
        const nextPayment = data?.payment || data;
        const nextStatus = pickStatus(data);
        const hasQr = nextPayment && (nextPayment.qr_string || nextPayment.qr_image_base64 || nextPayment.md5 || nextPayment.bill_number);
        if (hasQr) setPayment(nextPayment);

        if (nextStatus === "paid") {
          setStatus("paid");
          notify("paid");
        } else if (nextStatus === "expired") {
          setStatus("expired");
          notify("expired");
        }
      } catch (err) {
        console.warn("Bakong poll failed", err);
      }
    }, POLL_INTERVAL);

    return () => clearInterval(poller);
  }, [notify, payment, paymentId, status, orderId]);

  const handleCopy = async () => {
    if (!payment?.md5) return;
    try {
      await navigator.clipboard.writeText(payment.md5);
    } catch (err) {
      console.warn("Clipboard copy failed", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="p-10 rounded-3xl bg-white/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
        <div className="inline-flex items-center gap-3 text-slate-600 dark:text-slate-300">
          <Smartphone className="w-5 h-5 animate-spin" />
          <span>Preparing Bakong QR...</span>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-700">
        <p className="font-semibold mb-3">Unable to reach Bakong</p>
        <p className="text-sm mb-4">{error}</p>
        <button
          type="button"
          onClick={hydrate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-600 text-white text-sm font-semibold shadow-sm"
        >
          <RefreshCcw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  const expired = status === "expired";
  const paid = status === "paid";

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-indigo-950 p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Amount due</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              {currency} {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className={`px-4 py-1 rounded-full text-sm font-semibold ${paid ? "bg-emerald-100 text-emerald-700" : expired ? "bg-rose-100 text-rose-700" : "bg-slate-900 text-white"}`}>
            {paid ? "Paid" : expired ? "Expired" : "Pending"}
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-xl">
            {payment?.qr_string ? (
              <QRCode value={payment.qr_string} size={260} level="M" includeMargin={true} />
            ) : (
              <div className="w-[260px] h-[260px] flex items-center justify-center text-slate-400">Generating...</div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Clock3 className="w-4 h-4 text-indigo-500" />
              {expired ? "QR expired" : `${secondsLeft}s left`}
            </div>
            {payment?.bill_number && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
                Bill {payment.bill_number}
              </div>
            )}
          </div>

          <div className="w-full rounded-2xl bg-slate-900 text-slate-100 px-4 py-3 flex items-center justify-between text-xs font-mono">
            <div className="flex-1 truncate">{payment?.md5}</div>
            <button onClick={handleCopy} className="ml-4 inline-flex items-center gap-1 text-indigo-200 hover:text-white">
              <Copy className="w-4 h-4" /> Copy
            </button>
          </div>

          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">1. Scan with Bakong / ABA</p>
              <p className="text-slate-500 dark:text-slate-400">Use any Bakong-ready banking app and scan the QR above.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-1">2. Confirm amount & pay</p>
              <p className="text-slate-500 dark:text-slate-400">Approve {currency} {Number(amount).toLocaleString()} then wait for auto confirmation.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Bakong MD5 verified every {POLL_INTERVAL / 1000}s
          </div>
          {expired && (
            <button
              type="button"
              onClick={hydrate}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-600 text-white text-sm font-semibold shadow-md"
            >
              <RefreshCcw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Regenerate QR
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

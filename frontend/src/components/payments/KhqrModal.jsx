import React, { useCallback, useEffect, useMemo, useState } from "react";
import QRCode from "qrcode.react";

/* ─── KHQR official brand colours ────────────────────── */
const KHQR_RED   = "#C0272D";
const BAKONG_GOLD = "#C88F09";

/* ─── NBC / KHQR logo (simplified official mark) ─────── */
const KhqrLogo = () => (
  <svg viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-8">
    <rect width="120" height="40" rx="6" fill={KHQR_RED}/>
    <text x="8" y="27" fontFamily="Arial Black,Arial,sans-serif" fontSize="18" fontWeight="900" fill="white" letterSpacing="1">KH</text>
    <text x="44" y="27" fontFamily="Arial Black,Arial,sans-serif" fontSize="18" fontWeight="900" fill={BAKONG_GOLD} letterSpacing="1">QR</text>
  </svg>
);

const BakongLogo = () => (
  <svg viewBox="0 0 100 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7">
    <rect width="100" height="36" rx="6" fill={BAKONG_GOLD}/>
    <text x="50" y="25" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontSize="14" fontWeight="900" fill="black" letterSpacing="0.5">BAKONG</text>
  </svg>
);

const NbcLogo = () => (
  <svg viewBox="0 0 68 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-7">
    <rect width="68" height="36" rx="6" fill="#1a3572"/>
    <text x="34" y="25" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontSize="14" fontWeight="900" fill="white" letterSpacing="0.5">NBC</text>
  </svg>
);

/* ─── status pill ─────────────────────────────────────── */
const StatusPill = ({ status }) => {
  const map = {
    pending:  { label: "Waiting", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" },
    paid:     { label: "Paid ✓",  cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300" },
    expired:  { label: "Expired", cls: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300" },
    idle:     { label: "Idle",    cls: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  };
  const { label, cls } = map[status] || map.idle;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>
      {label}
    </span>
  );
};

/* ══════════════════════════════════════════════════════ */
export default function KhqrModal({
  open,
  onClose,
  qrImageBase64,
  qrString,
  billNumber,
  md5,
  expiresAt,
  status,
  loading,
  error,
  amount,
  currency,
  onRegenerate,
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    if (!open || !expiresAt) return;
    const end = new Date(expiresAt).getTime();
    const tick = () => setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open, expiresAt]);

  const formattedTime = useMemo(() => {
    const m = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const s = (timeLeft % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }, [timeLeft]);

  const handleCopy = useCallback(async (text, key) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {}
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* sheet */}
      <div className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden [animation:fsModalIn_220ms_ease-out]">

        {/* ── branded header ─────────────────── */}
        <div
          className="relative px-5 pt-5 pb-4 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${KHQR_RED} 0%, #8b1a1e 100%)` }}
        >
          {/* soft glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 20% 30%, rgba(255,255,255,0.14) 0%, transparent 60%)" }}/>

          <div className="relative flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <KhqrLogo />
                <BakongLogo />
                <NbcLogo />
              </div>
              <p className="mt-2 text-xs text-white/70">Scan with your mobile banking or Bakong app</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white hover:bg-white/25 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* amount + timer row */}
          <div className="relative mt-4 flex items-center gap-3">
            <div className="flex-1 rounded-xl bg-black/20 backdrop-blur-sm px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Amount</p>
              <p className="text-lg font-black text-white">{amount ?? "--"} <span className="text-base font-semibold text-white/80">{currency}</span></p>
            </div>
            <div className="rounded-xl bg-black/20 backdrop-blur-sm px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-widest text-white/60">Expires in</p>
              <p className={`text-lg font-black ${timeLeft < 30 ? "text-amber-300" : "text-white"}`}>{formattedTime}</p>
            </div>
            <div className="rounded-xl bg-black/20 backdrop-blur-sm px-4 py-2.5 flex flex-col items-start">
              <p className="text-[10px] uppercase tracking-widest text-white/60 mb-1">Status</p>
              <StatusPill status={status} />
            </div>
          </div>
        </div>

        {/* ── QR section ─────────────────────── */}
        <div className="px-5 pt-5 pb-2">
          <div className="relative rounded-2xl border-2 border-dashed border-red-200 dark:border-red-900/60 bg-gradient-to-br from-red-50 to-white dark:from-slate-800 dark:to-slate-900 p-5 flex items-center justify-center min-h-[240px]">
            {/* corner decorators */}
            <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 rounded-tl-lg" style={{ borderColor: KHQR_RED }}/>
            <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 rounded-tr-lg" style={{ borderColor: KHQR_RED }}/>
            <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 rounded-bl-lg" style={{ borderColor: KHQR_RED }}/>
            <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 rounded-br-lg" style={{ borderColor: KHQR_RED }}/>

            {loading ? (
              <div className="text-center">
                <div className="mx-auto w-10 h-10 rounded-full border-4 border-red-200 border-t-red-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Generating KHQR…</p>
              </div>
            ) : qrImageBase64 ? (
              <img src={`data:image/png;base64,${qrImageBase64}`} alt="KHQR" className="w-56 h-56 object-contain" />
            ) : qrString ? (
              <QRCode value={qrString} size={220} level="M" includeMargin />
            ) : (
              <div className="text-center text-sm text-slate-400 dark:text-slate-500">QR image not available</div>
            )}
          </div>
        </div>

        {/* ── how-to steps ───────────────────── */}
        <div className="px-5 pt-3 grid grid-cols-3 gap-2.5">
          {[
            { n: "1", icon: "📱", text: "Open banking\nor Bakong app" },
            { n: "2", icon: "🔍", text: "Tap Scan &\npoint at QR" },
            { n: "3", icon: "✅", text: "Confirm &\nreturn here" },
          ].map(({ n, icon, text }) => (
            <div key={n} className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-2.5 text-center">
              <div className="text-lg">{icon}</div>
              <div className="mt-1 text-[10px] font-bold text-slate-500 dark:text-slate-400" style={{ whiteSpace: "pre-line" }}>{text}</div>
            </div>
          ))}
        </div>

        {/* ── bill / md5 refs ────────────────── */}
        {(billNumber || md5) && (
          <div className="px-5 pt-3 grid gap-2">
            {billNumber && (
              <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">Bill No.</p>
                  <p className="text-sm font-mono text-slate-800 dark:text-slate-100 truncate">{billNumber}</p>
                </div>
                <button
                  onClick={() => handleCopy(billNumber, "bill")}
                  className="ml-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
                >
                  {copied === "bill" ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
            {md5 && (
              <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-800 px-3.5 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500">MD5</p>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">{md5}</p>
                </div>
                <button
                  onClick={() => handleCopy(md5, "md5")}
                  className="ml-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex-shrink-0"
                >
                  {copied === "md5" ? "Copied!" : "Copy"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── error / paid / expired ─────────── */}
        {error && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}
        {status === "paid" && (
          <div className="mx-5 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-sm border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <span className="font-semibold">Payment received! Finishing your order…</span>
          </div>
        )}
        {status === "expired" && (
          <div className="mx-5 mt-3 flex flex-col sm:flex-row gap-2">
            <div className="flex-1 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-sm border border-amber-200 dark:border-amber-800">
              KHQR expired. Please generate a new code.
            </div>
            <button
              onClick={onRegenerate}
              className="sm:w-auto w-full rounded-xl px-5 py-3 text-sm font-bold text-white"
              style={{ background: KHQR_RED }}
            >
              Regenerate QR
            </button>
          </div>
        )}

        {/* ── footer tip ─────────────────────── */}
        <div className="px-5 pt-3 pb-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Keep this screen open while you complete payment on your banking app.
        </div>
      </div>
    </div>
  );
}



import React, { useEffect, useState } from "react";

/* ── brand tokens ── */
const KHQR_RED  = "#C0272D";
const GOLD      = "#C88F09";

/* ── inject keyframes once ── */
const STYLE_ID = "khqr-success-kf";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes ksOverlay   { from{opacity:0} to{opacity:1} }
    @keyframes ksCard      { from{opacity:0;transform:translateY(40px) scale(.95)} to{opacity:1;transform:none} }
    @keyframes ksPop       { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }
    @keyframes ksDraw      { to{stroke-dashoffset:0} }
    @keyframes ksPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.5)} 60%{box-shadow:0 0 0 22px rgba(16,185,129,0)} }
    @keyframes ksConfetti  { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(220px) rotate(720deg);opacity:0} }
    @keyframes ksFadeUp    { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
    @keyframes ksBar       { from{width:100%} to{width:0%} }
    .ks-overlay   { animation: ksOverlay .3s ease both; }
    .ks-card      { animation: ksCard    .45s cubic-bezier(.22,.61,.36,1) .05s both; }
    .ks-pop       { animation: ksPop     .55s cubic-bezier(.34,1.56,.64,1) .15s both; }
    .ks-pulse     { animation: ksPulse   1.8s .6s ease-in-out infinite; }
    .ks-draw      { stroke-dasharray:28; stroke-dashoffset:28; animation: ksDraw .45s .6s ease forwards; }
    .ks-fade-0    { animation: ksFadeUp .45s .3s both; }
    .ks-fade-1    { animation: ksFadeUp .45s .45s both; }
    .ks-fade-2    { animation: ksFadeUp .45s .6s both; }
    .ks-fade-3    { animation: ksFadeUp .45s .75s both; }
    .ks-bar       { animation: ksBar var(--dur,3s) linear forwards; }
  `;
  document.head.appendChild(s);
}

/* ── tiny confetti piece ── */
function Confetti({ color, left, delay, duration }) {
  return (
    <span
      className="absolute top-0 rounded-sm pointer-events-none"
      style={{
        left,
        width: 7,
        height: 12,
        background: color,
        animation: `ksConfetti ${duration}s ${delay}s ease-in both`,
        transform: "rotate(-30deg)",
      }}
    />
  );
}

const PIECES = [
  { color: GOLD,       left: "12%",  delay: 0.1, duration: 1.6 },
  { color: "#10b981",  left: "25%",  delay: 0.3, duration: 1.4 },
  { color: KHQR_RED,   left: "40%",  delay: 0.1, duration: 1.8 },
  { color: "#6366f1",  left: "55%",  delay: 0.4, duration: 1.5 },
  { color: GOLD,       left: "70%",  delay: 0.2, duration: 1.7 },
  { color: "#10b981",  left: "82%",  delay: 0.5, duration: 1.3 },
  { color: KHQR_RED,   left: "93%",  delay: 0.0, duration: 1.6 },
  { color: "#f59e0b",  left: "5%",   delay: 0.6, duration: 1.9 },
  { color: "#6366f1",  left: "47%",  delay: 0.7, duration: 1.4 },
];

/* ══════════════════════════════════════════ */
export default function KhqrSuccessModal({
  open,
  orderNumber = "—",
  total = "—",
  currency = "KHR",
  redirectSeconds = 4,
  onClose,
}) {
  const [timeLeft, setTimeLeft] = useState(redirectSeconds);

  useEffect(() => {
    if (!open) { setTimeLeft(redirectSeconds); return; }
    const t = setInterval(() => setTimeLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [open, redirectSeconds]);

  if (!open) return null;

  const fmt = (v) =>
    Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="ks-overlay fixed inset-0 z-[2000] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}
    >
      {/* ── card ── */}
      <div
        className="ks-card relative w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-2xl"
      >
        {/* confetti burst */}
        <div className="absolute inset-x-0 top-0 h-1 overflow-visible pointer-events-none">
          {PIECES.map((p, i) => <Confetti key={i} {...p} />)}
        </div>

        {/* ── branded top header ── */}
        <div
          className="relative px-6 pt-8 pb-6 text-center overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${KHQR_RED} 0%, #8b1a1e 100%)` }}
        >
          {/* soft glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 25% 30%, rgba(255,255,255,.18), transparent 60%)" }}
          />

          {/* logos row */}
          <div className="relative flex items-center justify-center gap-2 mb-5">
            {/* KHQR pill */}
            <span
              className="flex items-center h-8 px-3 rounded-md text-white text-sm font-black tracking-widest"
              style={{ background: KHQR_RED, border: "1.5px solid rgba(255,255,255,.3)" }}
            >
              KH<span style={{ color: GOLD }}>QR</span>
            </span>
            {/* BAKONG pill */}
            <span
              className="flex items-center h-8 px-3 rounded-md text-black text-sm font-black tracking-wider"
              style={{ background: GOLD }}
            >
              BAKONG
            </span>
            {/* NBC pill */}
            <span
              className="flex items-center h-8 px-3 rounded-md text-white text-sm font-black"
              style={{ background: "#1a3572" }}
            >
              NBC
            </span>
          </div>

          {/* animated check icon */}
          <div
            className="ks-pop ks-pulse mx-auto flex items-center justify-center rounded-full bg-emerald-500"
            style={{ width: 80, height: 80 }}
          >
            <svg viewBox="0 0 28 28" fill="none" width="42" height="42">
              <polyline
                className="ks-draw"
                points="5,15 12,22 23,7"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* headline */}
          <h2 className="ks-fade-0 relative mt-4 text-2xl font-black text-white leading-snug">
            Payment Successful!
          </h2>
          <p className="ks-fade-1 relative mt-1 text-sm text-white/70">
            via KHQR · Bakong Network
          </p>
        </div>

        {/* ── body ── */}
        <div className="px-6 pb-6 pt-5 space-y-4">
          {/* confirmation line */}
          <p className="ks-fade-2 text-center text-base font-semibold text-slate-800 dark:text-slate-100">
            Your order is confirmed. 🎉
          </p>

          {/* order detail card */}
          <div
            className="ks-fade-2 rounded-2xl border border-slate-100 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-800/60"
          >
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Order
              </div>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{orderNumber}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Amount paid
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {currency} {fmt(total)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-slate-400">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Status
              </div>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Paid &amp; Processing
              </span>
            </div>
          </div>

          {/* redirect countdown bar */}
          <div className="ks-fade-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
              <span>Redirecting to your orders</span>
              <span className="font-semibold tabular-nums text-slate-600 dark:text-slate-300">{timeLeft}s</span>
            </div>
            <div className="relative h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
              <div
                className="ks-bar absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400"
                style={{ "--dur": `${redirectSeconds}s` }}
              />
            </div>
          </div>

          {/* close / view orders button */}
          {onClose && (
            <button
              onClick={onClose}
              className="ks-fade-3 w-full rounded-2xl py-3 text-sm font-bold text-white shadow-md transition-opacity hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${KHQR_RED}, #8b1a1e)` }}
            >
              View My Orders
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

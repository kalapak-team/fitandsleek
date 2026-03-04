import React, { useEffect, useState } from "react";

/* Inject keyframes once */
const STYLE_ID = "psa-keyframes";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes psaFadeUp   { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:none; } }
    @keyframes psaPopIn    { 0%{opacity:0;transform:scale(.5)} 60%{transform:scale(1.15)} 100%{opacity:1;transform:scale(1)} }
    @keyframes psaCheckDraw{ to { stroke-dashoffset:0; } }
    @keyframes psaDot      { 0%,100%{transform:scale(0);opacity:0} 50%{transform:scale(1);opacity:1} }
    @keyframes psaPulse    { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,.45)} 50%{box-shadow:0 0 0 18px rgba(16,185,129,0);} }
    @keyframes psaSlide    { from{opacity:0;transform:translateX(-14px)} to{opacity:1;transform:none} }
    .psa-fade-up   { animation: psaFadeUp   .55s cubic-bezier(.22,.61,.36,1) both; }
    .psa-pop-in    { animation: psaPopIn    .55s cubic-bezier(.34,1.56,.64,1) .1s both; }
    .psa-check     { stroke-dasharray:20; stroke-dashoffset:20; animation: psaCheckDraw .45s .5s ease forwards; }
    .psa-pulse     { animation: psaPulse 1.8s .5s ease-in-out infinite; }
    .psa-slide     { animation: psaSlide .5s cubic-bezier(.22,.61,.36,1) both; }
    .psa-dot-0     { animation: psaDot 1.4s .6s ease-in-out infinite; }
    .psa-dot-1     { animation: psaDot 1.4s .8s ease-in-out infinite; }
    .psa-dot-2     { animation: psaDot 1.4s 1s  ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

const DOTS = [
  { cx: "10%", cy: "18%", r: 5,  delay: "psa-dot-0", color: "rgba(52,211,153,.7)" },
  { cx: "88%", cy: "12%", r: 4,  delay: "psa-dot-1", color: "rgba(167,243,208,.8)" },
  { cx: "80%", cy: "85%", r: 6,  delay: "psa-dot-2", color: "rgba(16,185,129,.5)" },
  { cx: "5%",  cy: "78%", r: 3,  delay: "psa-dot-0", color: "rgba(110,231,183,.6)" },
  { cx: "50%", cy: "92%", r: 4,  delay: "psa-dot-1", color: "rgba(52,211,153,.4)" },
];

export default function PaymentSuccessAlert({ orderNumber = "—", total = "—", currency = "USD" }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);
  if (!visible) return null;

  const fmt = (v) =>
    Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div
      className="psa-fade-up relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 shadow-2xl shadow-emerald-100/60 dark:shadow-none"
      style={{ marginBottom: "2rem" }}
    >
      {/* ── background gradient ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, rgba(16,185,129,.10) 0%, rgba(255,255,255,0) 55%, rgba(52,211,153,.08) 100%)",
        }}
      />

      {/* ── floating dots ── */}
      {DOTS.map((d, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${d.delay}`}
          style={{ left: d.cx, top: d.cy, width: d.r * 2, height: d.r * 2, background: d.color }}
        />
      ))}

      {/* ── top accent bar ── */}
      <div className="relative h-1.5 w-full rounded-t-3xl bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />

      <div className="relative px-6 pt-6 pb-7">
        {/* ── icon + headline ── */}
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          {/* Circle + checkmark */}
          <div
            className="psa-pop-in psa-pulse flex items-center justify-center rounded-full bg-emerald-500 shadow-lg"
            style={{ width: 72, height: 72 }}
          >
            <svg viewBox="0 0 24 24" fill="none" width="36" height="36">
              <polyline
                className="psa-check"
                points="5,13 10,18 19,7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Payment confirmed
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-snug max-w-sm">
            Your payment was successful.
            <span className="block text-emerald-600 dark:text-emerald-400">Your order is confirmed.</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
            A receipt and tracking updates will be saved to your account.
          </p>
        </div>

        {/* ── order details card ── */}
        <div
          className="psa-slide mx-auto max-w-sm rounded-2xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 divide-y divide-slate-100 dark:divide-slate-700 overflow-hidden"
          style={{ animationDelay: ".25s" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Order number
            </div>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-sm">{orderNumber}</span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Amount paid
            </div>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
              {currency} {fmt(total)}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">
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

        {/* ── redirect note ── */}
        <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Redirecting to your orders...
        </p>
      </div>
    </div>
  );
}
import React, { useState } from "react";

/* ─── brand detection ────────────────────────────────── */
const formatCardNumber = (val = "") => {
  const d = val.replace(/\D/g, "").slice(0, 16);
  return d.match(/.{1,4}/g)?.join("  ") ?? "";
};

const formatExpiry = (val = "") => {
  const d = val.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

const detectBrand = (num = "") => {
  const n = num.replace(/\D/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^62/.test(n)) return "unionpay";
  return null;
};

/* ─── SVG brand logos ─────────────────────────────────── */
const VisaSvg = () => (
  <svg viewBox="0 0 750 471" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <rect width="750" height="471" rx="35" fill="#1A1F71"/>
    <path d="M278 334L311 138H362L329 334H278Z" fill="white"/>
    <path d="M491 142C481 138 464 134 444 134C393 134 357 161 357 199C356 227 382 242 402 251C422 260 429 266 429 274C428 286 413 292 399 292C379 292 368 289 351 282L344 279L337 326C349 332 370 337 392 337C446 337 481 310 481 270C481 248 468 231 440 217C421 208 410 202 410 193C411 183 421 173 443 173C461 173 475 177 486 181L492 184L499 142H491Z" fill="white"/>
    <path d="M565 138H525C512 138 503 142 497 156L421 334H475C475 334 484 311 486 305H551C553 313 558 334 558 334H605L565 138ZM499 266C503 254 520 206 520 206C519 207 524 193 527 185L530 204C530 204 541 254 543 266H499Z" fill="white"/>
    <path d="M234 138L183 263L178 241C169 214 146 184 120 170L167 334H222L317 138H234Z" fill="white"/>
    <path d="M150 138H64L63 143C126 158 168 193 185 240L168 157C165 143 157 139 150 138Z" fill="#FAA61A"/>
  </svg>
);

const MastercardSvg = () => (
  <svg viewBox="0 0 152 95" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <circle cx="55" cy="47.5" r="42" fill="#EB001B"/>
    <circle cx="97" cy="47.5" r="42" fill="#F79E1B"/>
    <path d="M76 18.2C87.1 26.5 94 39.2 94 53.5S87.1 80.5 76 88.8C64.9 80.5 58 67.8 58 53.5S64.9 26.5 76 18.2Z" fill="#FF5F00"/>
  </svg>
);

const AmexSvg = () => (
  <svg viewBox="0 0 750 471" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <rect width="750" height="471" rx="35" fill="#2557D6"/>
    <text x="375" y="270" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontSize="110" fontWeight="900" letterSpacing="6" fill="white">AMEX</text>
  </svg>
);

const UnionPaySvg = () => (
  <svg viewBox="0 0 750 471" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
    <rect width="750" height="471" rx="35" fill="#DE1F26"/>
    <rect x="12" y="12" width="726" height="447" rx="26" fill="none" stroke="white" strokeWidth="6" opacity="0.3"/>
    <text x="375" y="280" textAnchor="middle" fontFamily="Arial Black,Arial,sans-serif" fontSize="120" fontWeight="900" fill="white">UP</text>
  </svg>
);

const BrandSvg = ({ brand }) => {
  if (brand === "visa") return <VisaSvg />;
  if (brand === "mastercard") return <MastercardSvg />;
  if (brand === "amex") return <AmexSvg />;
  if (brand === "unionpay") return <UnionPaySvg />;
  return null;
};

/* ─── EMV chip ────────────────────────────────────────── */
const ChipIcon = () => (
  <svg width="46" height="35" viewBox="0 0 46 35" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="44" height="33" rx="5" fill="#D4A843" stroke="#B8882F" strokeWidth="1.5"/>
    <rect x="7" y="1" width="1" height="33" fill="#B8882F" opacity="0.55"/>
    <rect x="18" y="1" width="1" height="33" fill="#B8882F" opacity="0.55"/>
    <rect x="27" y="1" width="1" height="33" fill="#B8882F" opacity="0.55"/>
    <rect x="38" y="1" width="1" height="33" fill="#B8882F" opacity="0.55"/>
    <rect x="1" y="7" width="44" height="1" fill="#B8882F" opacity="0.55"/>
    <rect x="1" y="27" width="44" height="1" fill="#B8882F" opacity="0.55"/>
    <rect x="14" y="7" width="18" height="21" rx="3" fill="#C4953A" stroke="#B8882F"/>
    <line x1="23" y1="7" x2="23" y2="28" stroke="#B8882F" strokeWidth="1"/>
    <line x1="14" y1="17" x2="32" y2="17" stroke="#B8882F" strokeWidth="1"/>
  </svg>
);

/* ─── contactless ─────────────────────────────────────── */
const ContactlessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 16C9.8 14.6 10.5 12.9 10.5 11s-.7-3.6-2-5" stroke="white" strokeWidth="1.7" strokeLinecap="round" opacity="0.55"/>
    <path d="M11.5 18.5C13.4 16.5 14.5 13.9 14.5 11s-1.1-5.5-3-7.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" opacity="0.75"/>
    <path d="M14.5 21C17.1 18.3 18.5 14.8 18.5 11s-1.4-7.3-4-10" stroke="white" strokeWidth="1.7" strokeLinecap="round"/>
  </svg>
);

/* ─── card network pills ──────────────────────────────── */
const NetworkBadges = ({ active }) => {
  const nets = [
    { id: "visa", label: "VISA", bg: "bg-[#1A1F71]", text: "text-white" },
    { id: "mastercard", label: "MC", bg: "bg-gradient-to-r from-[#EB001B] to-[#F79E1B]", text: "text-white" },
    { id: "amex", label: "AMEX", bg: "bg-[#2557D6]", text: "text-white" },
    { id: "unionpay", label: "UP", bg: "bg-[#DE1F26]", text: "text-white" },
  ];
  return (
    <div className="flex items-center gap-1.5">
      {nets.map(({ id, label, bg, text }) => (
        <span
          key={id}
          className={`text-[10px] font-black px-2 py-0.5 rounded ${bg} ${text} transition-all ${
            active && active !== id ? "opacity-25 grayscale" : "opacity-100"
          }`}
        >
          {label}
        </span>
      ))}
    </div>
  );
};

/* ══════════════════════════════════════════════════════ */
export default function CheckoutPaymentCard({ value, errors = {}, onChange, t }) {
  const card = value || {};
  const tr = (key, fallback) => (typeof t === "function" ? t(key) : fallback || key);
  const update = (patch) => onChange?.({ ...card, ...patch });
  const [focused, setFocused] = useState(null);

  const brand = detectBrand(card.number);
  const digits = (card.number || "").replace(/\D/g, "");
  const parts = [0, 1, 2, 3].map((g) => {
    const chunk = digits.slice(g * 4, g * 4 + 4);
    return chunk.padEnd(4, focused === "cvc" || !chunk ? "•" : "");
  });

  const cardBg =
    brand === "visa"
      ? "from-[#1A1F71] via-[#1e3c9e] to-[#1A1F71]"
      : brand === "mastercard"
      ? "from-gray-900 via-gray-800 to-gray-900"
      : brand === "amex"
      ? "from-[#00695c] via-[#00897b] to-[#00695c]"
      : brand === "unionpay"
      ? "from-[#8b0000] via-[#c0392b] to-[#8b0000]"
      : "from-slate-900 via-[#1e293b] to-slate-900";

  const inputBase =
    "block w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none";

  return (
    <div className="mt-4 space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {tr("cardFormTitle", "Card details")}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {tr("cardFormSubtitle", "Secured by 256-bit SSL encryption.")}
          </p>
        </div>
        <NetworkBadges active={brand} />
      </div>

      {/* ── card visualisation ─────────────── */}
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${cardBg} shadow-2xl overflow-hidden text-white`}
        style={{ paddingBottom: "56.25%" }}
      >
        <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between">
          {/* shine */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 18% 18%, rgba(255,255,255,0.22) 0%, transparent 55%)" }}
          />
          {/* row 1 */}
          <div className="relative flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/60 font-semibold">Fit &amp; Sleek</p>
            </div>
            <div className="flex items-center gap-2">
              <ContactlessIcon />
              {brand && (
                <div className="h-7 w-12 bg-white/15 backdrop-blur-sm rounded p-0.5 overflow-hidden">
                  <BrandSvg brand={brand} />
                </div>
              )}
            </div>
          </div>
          {/* chip */}
          <div className="relative"><ChipIcon /></div>
          {/* number */}
          <div className="relative">
            {focused === "cvc" ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-7 rounded bg-white/20 backdrop-blur-sm" />
                <span className="font-mono tracking-widest text-white/90">
                  {"• ".repeat(card.cvc?.length || 3).trim()}
                </span>
              </div>
            ) : (
              <div className="flex gap-3 sm:gap-4">
                {parts.map((p, i) => (
                  <span key={i} className="font-mono text-base sm:text-lg tracking-[0.18em] font-semibold drop-shadow">
                    {p || "••••"}
                  </span>
                ))}
              </div>
            )}
          </div>
          {/* row 4 */}
          <div className="relative grid grid-cols-2 gap-2 text-xs">
            <div>
              <div className="uppercase text-white/50 tracking-widest text-[9px] mb-0.5">Card holder</div>
              <div className="font-semibold tracking-wider uppercase truncate">
                {card.name || "YOUR NAME"}
              </div>
            </div>
            <div className="text-right">
              <div className="uppercase text-white/50 tracking-widest text-[9px] mb-0.5">Expires</div>
              <div className="font-semibold tracking-wider">{card.expiry || "MM / YY"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── input panel ────────────────────── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-900">

        {/* card number */}
        <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${focused === "number" ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""} ${errors.number ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <path strokeLinecap="round" d="M2 10h20"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              {tr("cardNumber", "Card number")}
            </p>
            <input
              value={formatCardNumber(card.number || "")}
              onChange={(e) => update({ number: e.target.value.replace(/\D/g,"").slice(0,16) })}
              onFocus={() => setFocused("number")}
              onBlur={() => setFocused(null)}
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="1234  5678  9012  3456"
              className={`${inputBase} font-mono tracking-wider`}
            />
            {errors.number && <p className="text-xs text-red-500 mt-0.5">{errors.number}</p>}
          </div>
          <div className="h-7 w-11 flex-shrink-0 overflow-hidden rounded">
            {brand ? <BrandSvg brand={brand} /> : <div className="h-full w-full border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-slate-800" />}
          </div>
        </div>

        {/* name */}
        <div className={`flex items-center gap-3 px-4 py-3.5 transition-colors ${focused === "name" ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""} ${errors.name ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
          <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              {tr("cardNameOnCard", "Name on card")}
            </p>
            <input
              value={card.name || ""}
              onChange={(e) => update({ name: e.target.value.toUpperCase() })}
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
              autoComplete="cc-name"
              placeholder="SOKHA CHAN"
              className={`${inputBase} tracking-wider font-medium uppercase`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </div>
        </div>

        {/* expiry / cvc / country */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-700">
          {/* expiry */}
          <div className={`px-4 py-3.5 transition-colors ${focused === "expiry" ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""} ${errors.expiry ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              {tr("cardExpiry", "Expiry")}
            </p>
            <input
              value={card.expiry || ""}
              onChange={(e) => update({ expiry: formatExpiry(e.target.value) })}
              onFocus={() => setFocused("expiry")}
              onBlur={() => setFocused(null)}
              inputMode="numeric"
              autoComplete="cc-exp"
              placeholder="MM/YY"
              className={`${inputBase} font-mono`}
            />
            {errors.expiry && <p className="text-xs text-red-500 mt-0.5">{errors.expiry}</p>}
          </div>
          {/* cvc */}
          <div className={`px-4 py-3.5 transition-colors ${focused === "cvc" ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""} ${errors.cvc ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5 flex items-center gap-1">
              {tr("cardCvc", "CVC / CVV")}
              <span title="3-4 digit code on the back of your card" className="cursor-help text-slate-300 dark:text-slate-600 text-[9px] rounded-full border w-3.5 h-3.5 inline-flex items-center justify-center">?</span>
            </p>
            <input
              value={card.cvc || ""}
              onChange={(e) => update({ cvc: e.target.value.replace(/\D/g,"").slice(0,4) })}
              onFocus={() => setFocused("cvc")}
              onBlur={() => setFocused(null)}
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder="•••"
              type="password"
              className={`${inputBase} font-mono`}
            />
            {errors.cvc && <p className="text-xs text-red-500 mt-0.5">{errors.cvc}</p>}
          </div>
          {/* country */}
          <div className={`px-4 py-3.5 transition-colors ${focused === "country" ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""} ${errors.country ? "bg-red-50 dark:bg-red-900/10" : ""}`}>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">
              {tr("cardBillingCountry", "Country")}
            </p>
            <input
              value={card.country || ""}
              onChange={(e) => update({ country: e.target.value })}
              onFocus={() => setFocused("country")}
              onBlur={() => setFocused(null)}
              placeholder="Cambodia"
              className={`${inputBase}`}
            />
            {errors.country && <p className="text-xs text-red-500 mt-0.5">{errors.country}</p>}
          </div>
        </div>
      </div>

      {/* ── footer row ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!card.remember}
            onChange={(e) => update({ remember: e.target.checked })}
            className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 accent-indigo-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            {tr("cardSaveCard", "Save card for faster checkout")}
          </span>
        </label>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          {tr("cardSecurityNote", "256-bit SSL · PCI DSS compliant")}
        </div>
      </div>
    </div>
  );
}

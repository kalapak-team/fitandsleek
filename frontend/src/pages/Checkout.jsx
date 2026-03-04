import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../lib/api";
import Swal from "sweetalert2";
import { useCart } from "../state/cart";
import { useAuth } from "../state/auth";
import { useLanguage } from "../lib/i18n.jsx";
import CheckoutPaymentKhqr from "../components/payments/CheckoutPaymentKhqr";
import CheckoutPaymentCard from "../components/payments/CheckoutPaymentCard";
import KhqrSuccessModal from "../components/alerts/KhqrSuccessModal";

const KHQR_REDIRECT_SECONDS = 60;

export default function Checkout() {
  const nav = useNavigate();
  const cart = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bakong_khqr");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [khqrOpen, setKhqrOpen] = useState(false);
  const [khqrOrder, setKhqrOrder] = useState(null);
  const [khqrSuccessOpen, setKhqrSuccessOpen] = useState(false);

  useEffect(() => {
    if (!khqrSuccessOpen) return;
    const t = setTimeout(() => nav("/orders"), KHQR_REDIRECT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [khqrSuccessOpen, nav]);
  const [cardDetails, setCardDetails] = useState({
    name: user?.name || "",
    number: "",
    expiry: "",
    cvc: "",
    country: "Cambodia",
    remember: true,
  });
  const [cardErrors, setCardErrors] = useState({});
  const { t } = useLanguage();
  const cartItems = cart.cart?.items || [];

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await api.get("/user/addresses");
        const list = data?.data || [];
        setAddresses(list);
        const defaultAddr = list.find((a) => a.is_default) || list[0];
        if (defaultAddr) setSelectedAddressId(String(defaultAddr.id));
      } catch {
        setAddresses([]);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (user?.name) {
      setCardDetails((prev) => ({ ...prev, name: prev.name || user.name }));
    }
  }, [user?.name]);

  const validateCardDetails = useCallback(() => {
    const errs = {};
    const number = (cardDetails.number || "").replace(/\D/g, "");
    if (!cardDetails.name?.trim()) errs.name = t('cardNameRequired') || "Name required";
    if (number.length < 12) errs.number = t('cardNumberInvalid') || "Enter a valid card number";
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardDetails.expiry || "")) {
      errs.expiry = t('cardExpiryInvalid') || "Use MM/YY";
    }
    if (!/^[0-9]{3,4}$/.test(cardDetails.cvc || "")) {
      errs.cvc = t('cardCvcInvalid') || "3-4 digits";
    }
    if (!cardDetails.country?.trim()) errs.country = t('cardCountryRequired') || "Required";
    return errs;
  }, [cardDetails, t]);

  const place = async () => {
    if (!user) {
      setMsg(t('loginRequiredCheckout'));
      setMsgType('error');
      return;
    }
    if (!paymentMethod) {
      setMsg(t('selectPaymentMethod'));
      setMsgType('error');
      return;
    }

    // If an order is already created and pending, just reopen/continue without needing cart items again
    if (paymentMethod === "bakong_khqr" && khqrOrder?.id) {
      setKhqrOpen(true);
      return;
    }

    if (!selectedAddressId) {
      setMsg(t('selectShippingAddress') || "Please select a shipping address");
      setMsgType('error');
      return;
    }

    const shippingAddress = addresses.find((a) => String(a.id) === String(selectedAddressId));
    if (!shippingAddress) {
      setMsg(t('selectShippingAddress') || "Please select a shipping address");
      setMsgType('error');
      return;
    }

    if (paymentMethod === "card_visa") {
      const errs = validateCardDetails();
      setCardErrors(errs);
      if (Object.keys(errs).length) {
        setMsg(t('cardFormFixErrors') || "Please fix the card details.");
        setMsgType('error');
        return;
      }
    }

    setLoading(true);
    setMsg("");
    setMsgType("");

    const showStockLimitAlert = async (stock, requestedQuantity) => {
      const safeStock = Number.isFinite(Number(stock)) ? Math.max(0, Number(stock)) : 0;
      const safeRequested = Number.isFinite(Number(requestedQuantity)) ? Math.max(1, Number(requestedQuantity)) : 1;

      const swalBase = {
        confirmButtonColor: "#497869",
        customClass: {
          popup: "font-sans",
          title: "font-sans",
          htmlContainer: "font-sans",
          confirmButton: "font-sans",
        },
      };

      if (safeStock === 0) {
        await Swal.fire({
          icon: "error",
          text: "សោកស្តាយ! ទំនិញនេះអស់ពីស្តុកហើយ (Out of Stock)",
          ...swalBase,
        });
        return;
      }

      if (safeRequested > safeStock) {
        await Swal.fire({
          icon: "warning",
          text: `ស្តុកមានកំណត់! យើងមានសល់ត្រឹមតែ ${safeStock} ប៉ុណ្ណោះ (Only ${safeStock} left in stock)`,
          ...swalBase,
        });
        return;
      }

      await Swal.fire({
        icon: "warning",
        text: `ស្តុកមានកំណត់! យើងមានសល់ត្រឹមតែ ${safeStock} ប៉ុណ្ណោះ (Only ${safeStock} left in stock)`,
        ...swalBase,
      });
    };

    const tryHandleStockError = async (err) => {
      const payload = err?.response?.data || {};
      const message = String(payload?.message || err?.message || "");
      const lower = message.toLowerCase();

      if (!lower.includes("stock")) {
        return false;
      }

      const payloadStock = Number(payload?.stock);
      const payloadRequested = Number(payload?.requested_quantity);
      const textMatches = message.match(/\d+/g);
      const messageStock = textMatches?.length ? Number(textMatches[textMatches.length - 1]) : NaN;

      const inferredStock = Number.isFinite(payloadStock)
        ? payloadStock
        : (Number.isFinite(messageStock) ? messageStock : (lower.includes("out of stock") ? 0 : Number(cartItems?.[0]?.product?.stock || 0)));
      const inferredRequested = Number.isFinite(payloadRequested)
        ? payloadRequested
        : Number(cartItems?.[0]?.quantity || 1);

      await showStockLimitAlert(inferredStock, inferredRequested);
      return true;
    };

    try {
      const { data } = await api.post("/checkout", {
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
      });
      if (paymentMethod === "bakong_khqr") {
        setKhqrOrder(data.order);
        setKhqrOpen(true);
        return;
      }

      // Redirect to payment processing page with card prefill so user types only once
      nav(`/payment/${data.order.id}`, { state: { cardPrefill: cardDetails } });
    } catch (e) {
      if (await tryHandleStockError(e)) {
        return;
      }
      setMsg(e?.response?.data?.message || t('checkoutFailed'));
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  /* ── helpers ── */
  const getPriceMeta = (item) => {
    const unitPaid = Number(item?.unit_price || item?.product?.final_price || item?.product?.price || 0);
    const unitOriginal = Number(item?.product?.price || unitPaid);
    const qty = Number(item?.quantity) || 1;
    const hasDiscount = unitOriginal > unitPaid;

    return {
      qty,
      unitPaid,
      unitOriginal,
      linePaid: unitPaid * qty,
      lineOriginal: unitOriginal * qty,
      hasDiscount,
    };
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const pricing = getPriceMeta(item);
    return sum + pricing.linePaid;
  }, 0);
  const shipping = 0; // free shipping
  const grandTotal = subtotal + shipping;

  const RadioDot = ({ active }) => (
    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-indigo-500 bg-indigo-500" : "border-slate-300 dark:border-slate-500"
      }`}>
      {active && (
        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
    </span>
  );

  return (
    <>
      {/* ── page shell ── */}
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">

        {/* ── breadcrumb bar ── */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Link to="/" className="hover:text-indigo-600 transition-colors">{t('home') || "Home"}</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <Link to="/cart" className="hover:text-indigo-600 transition-colors">{t('cart') || "Cart"}</Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            <span className="text-slate-900 dark:text-white font-medium">{t('checkout')}</span>
          </div>
        </div>

        {/* ── step indicator ── */}
        <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
            <ol className="flex items-center gap-0">
              {[
                { label: t('cart') || "Cart", done: true },
                { label: t('checkout'), active: true },
                { label: t('confirmation') || "Confirmation", done: false },
              ].map((step, i, arr) => (
                <React.Fragment key={i}>
                  <li className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? "bg-indigo-600 text-white" : step.active ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900" : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                      }`}>
                      {step.done ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      ) : i + 1}
                    </span>
                    <span className={`text-sm font-semibold ${step.active ? "text-indigo-600 dark:text-indigo-400" : step.done ? "text-slate-700 dark:text-slate-300" : "text-slate-400"}`}>{step.label}</span>
                  </li>
                  {i < arr.length - 1 && (
                    <span className="flex-1 mx-3 h-px bg-slate-200 dark:bg-slate-700" />
                  )}
                </React.Fragment>
              ))}
            </ol>
          </div>
        </div>

        {/* ── two-column layout ── */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:grid lg:grid-cols-[1fr_400px] lg:gap-10 lg:items-start">

          {/* ══════════════════════════════════
            LEFT — forms
        ══════════════════════════════════ */}
          <div className="space-y-6">

            {/* ── 1. CONTACT / AUTH ── */}
            {!user && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">!</span>
                  {t('loginRequired') || "Sign in required"}
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {t('loginRequiredToCheckout')}
                </p>
                <Link
                  to="/login"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  {t('login')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            )}

            {/* ── 2. SHIPPING ADDRESS ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t('shippingAddress') || "Delivery address"}
                </h2>
                {user && (
                  <Link to="/profile?tab=addresses" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold">
                    {t('manageAddresses') || "Manage"}
                  </Link>
                )}
              </div>
              <div className="p-6">
                {!user ? (
                  <p className="text-sm text-slate-500">{t('loginRequiredToCheckout')}</p>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t('noSavedAddresses') || "No saved addresses."}</p>
                    <Link to="/profile?tab=addresses" className="mt-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline font-semibold">
                      + {t('manageAddresses') || "Add address"}
                    </Link>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {addresses.map((addr) => {
                      const active = String(selectedAddressId) === String(addr.id);
                      return (
                        <label
                          key={addr.id}
                          className={`group cursor-pointer flex gap-3 p-4 border-2 rounded-xl transition-all ${active
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                            : "border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-700"
                            }`}
                        >
                          <input type="radio" name="shipping_address" value={addr.id}
                            checked={active} onChange={(e) => setSelectedAddressId(e.target.value)} className="sr-only" />
                          <RadioDot active={active} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">{addr.label}</span>
                              {addr.is_default && (
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">Default</span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Receiver: {addr.receiver_name || user?.name || "-"} • {addr.receiver_phone || user?.phone || "-"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-snug">
                              {addr.formatted_address || [addr.street, addr.city, addr.state, addr.zip, addr.country].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── 3. PAYMENT METHOD ── */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  {t('paymentMethod')}
                </h2>
              </div>
              <div className="p-6 space-y-4">

                {/* Bakong KHQR */}
                <label className={`group flex gap-0 rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${paymentMethod === "bakong_khqr"
                  ? "border-amber-400 shadow-md shadow-amber-100 dark:shadow-amber-900/30"
                  : "border-slate-200 dark:border-slate-600 hover:border-amber-300"
                  }`}>
                  <input type="radio" name="payment" value="bakong_khqr"
                    checked={paymentMethod === "bakong_khqr"}
                    onChange={(e) => { setPaymentMethod(e.target.value); setCardErrors({}); setMsg(""); }}
                    className="sr-only" />

                  {/* left accent bar */}
                  <div className={`w-1.5 flex-shrink-0 transition-colors ${paymentMethod === "bakong_khqr" ? "bg-amber-400" : "bg-transparent group-hover:bg-amber-200"}`} />

                  <div className="flex-1 p-4 flex items-center gap-4">
                    <RadioDot active={paymentMethod === "bakong_khqr"} />

                    {/* KHQR logo icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#C0272D" }}>
                      <svg viewBox="0 0 48 48" width="28" height="28">
                        <text x="4" y="20" fill="white" fontWeight="900" fontSize="13" fontFamily="Arial">KH</text>
                        <text x="4" y="36" fill="#C88F09" fontWeight="900" fontSize="13" fontFamily="Arial">QR</text>
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">{t('paymentMethodBakong') || "KHQR / Bakong"}</span>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">Instant</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('paymentMethodBakongDesc') || "Scan QR with any Cambodian bank app"}</p>
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {/* KHQR */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-white" style={{ background: "#C0272D" }}>KHQR</span>
                        {/* Bakong */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-black" style={{ background: "#C88F09" }}>BAKONG</span>
                        {/* NBC */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-white" style={{ background: "#1B3A6B" }}>NBC</span>
                      </div>
                    </div>

                    {paymentMethod === "bakong_khqr" && (
                      <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>

                {/* Card / VISA */}
                <label className={`group flex gap-0 rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${paymentMethod === "card_visa"
                  ? "border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-indigo-900/30"
                  : "border-slate-200 dark:border-slate-600 hover:border-indigo-300"
                  }`}>
                  <input type="radio" name="payment" value="card_visa"
                    checked={paymentMethod === "card_visa"}
                    onChange={(e) => { setPaymentMethod(e.target.value); setMsg(""); }}
                    className="sr-only" />
                  <div className={`w-1.5 flex-shrink-0 transition-colors ${paymentMethod === "card_visa" ? "bg-indigo-500" : "bg-transparent group-hover:bg-indigo-200"}`} />

                  <div className="flex-1 p-4 flex items-center gap-4">
                    <RadioDot active={paymentMethod === "card_visa"} />

                    {/* credit card icon */}
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-indigo-600 to-blue-500">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-white">{t('paymentMethodCardVisa') || "Credit / Debit Card"}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide">Secure</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('paymentMethodCardDesc') || "Visa, Mastercard, Amex, UnionPay"}</p>
                      <div className="flex items-center gap-1.5 mt-2.5">
                        {/* Visa */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-white" style={{ background: "#1A1F71" }}>VISA</span>
                        {/* MC */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-white" style={{ background: "#EB001B" }}>MC</span>
                        {/* Amex */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-white" style={{ background: "#2557D6" }}>AMEX</span>
                        {/* UnionPay */}
                        <span className="inline-flex items-center h-5 px-2 rounded text-[10px] font-bold text-white" style={{ background: "#DE1F26" }}>UP</span>
                      </div>
                    </div>

                    {paymentMethod === "card_visa" && (
                      <svg className="w-5 h-5 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </label>

                {/* KHQR info note */}
                {paymentMethod === "bakong_khqr" && (
                  <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3">
                    <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">KHQR / Bakong</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        Works with ABA, Wing, ACLEDA, Canadia, and most Cambodian bank apps.
                        A QR code will appear after you confirm your order.
                      </p>
                    </div>
                  </div>
                )}

                {/* Card form */}
                {paymentMethod === "card_visa" && (
                  <CheckoutPaymentCard
                    t={t}
                    value={cardDetails}
                    errors={cardErrors}
                    onChange={(next) => {
                      setCardDetails(next);
                      if (Object.keys(cardErrors).length) {
                        setCardErrors((prev) => {
                          const clone = { ...prev };
                          Object.keys(prev).forEach((key) => { if (next[key]) delete clone[key]; });
                          return clone;
                        });
                      }
                    }}
                  />
                )}
              </div>
            </div>

            {/* ── 4. ERROR MESSAGE ── */}
            {msg && (
              <div className={`flex items-start gap-3 rounded-2xl p-4 text-sm ${msgType === "error"
                ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                }`}>
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={msgType === "error"
                    ? "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                </svg>
                <span className="font-medium">{msg}</span>
              </div>
            )}

            {/* ── mobile CTA (visible only <lg) ── */}
            <div className="lg:hidden">
              <button
                onClick={place}
                disabled={loading || !paymentMethod}
                className={`w-full rounded-2xl text-white py-4 text-base font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === "bakong_khqr" ? "bg-[#C88F09] shadow-amber-200 dark:shadow-amber-900/30" : "bg-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/30"
                  }`}
              >
                {loading ? (
                  <><svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>{t('processing')}</>
                ) : paymentMethod === "bakong_khqr"
                  ? <><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="15" y="15" width="2" height="2" fill="currentColor" /><rect x="19" y="15" width="2" height="2" fill="currentColor" /><rect x="15" y="19" width="2" height="2" fill="currentColor" /><rect x="19" y="19" width="2" height="2" fill="currentColor" /></svg>{t('payWithKHQR') || "Pay with KHQR"}</>
                  : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('placeOrder')}</>
                }
              </button>
              <Link to="/cart" className="mt-3 w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3.5 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                {t('backToCart')}
              </Link>
            </div>

          </div>{/* end left column */}

          {/* ══════════════════════════════════
            RIGHT — sticky order summary
        ══════════════════════════════════ */}
          <div className="mt-8 lg:mt-0 lg:sticky lg:top-6 space-y-4">

            {/* order summary card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('orderSummary') || "Order Summary"}
                </h2>
              </div>

              {/* item list */}
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {cartItems.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-slate-500">{t('cartEmpty') || "Your cart is empty"}</p>
                ) : cartItems.map((item, idx) => {
                  const name = item?.product?.name || item?.name || item?.product_name || "Item";
                  const pricing = getPriceMeta(item);
                  const img = item?.product?.images?.[0]?.url || item?.product?.image_url || null;
                  return (
                    <div key={item?.id || idx} className="flex items-center gap-3 px-6 py-3.5">
                      {/* product thumbnail */}
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                        {img ? (
                          <img src={img} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-6 h-6 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Qty: {pricing.qty} • ${pricing.unitPaid.toFixed(2)}
                          {pricing.hasDiscount && (
                            <span className="ml-1 line-through">${pricing.unitOriginal.toFixed(2)}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {pricing.hasDiscount && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-through">${pricing.lineOriginal.toFixed(2)}</p>
                        )}
                        <p className="text-sm font-bold text-slate-900 dark:text-white">${pricing.linePaid.toFixed(2)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* price breakdown */}
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{t('subtotal') || "Subtotal"} ({cart.count} {t('items') || "items"})</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{t('shipping') || "Shipping"}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('freeShipping') || "FREE"}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
                  <span>{t('tax') || "Tax"}</span>
                  <span>{t('includedInPrice') || "Included"}</span>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/40 border-t border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-slate-900 dark:text-white">{t('total') || "Total"}</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  {t('taxIncluded') || "All prices inclusive of applicable taxes"}
                </p>
              </div>

              {/* CTA — desktop */}
              <div className="hidden lg:block px-6 pb-6">
                <button
                  onClick={place}
                  disabled={loading || !paymentMethod}
                  className={`mt-4 w-full rounded-2xl text-white py-4 text-base font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${paymentMethod === "bakong_khqr"
                    ? "bg-[#C88F09] shadow-amber-200 dark:shadow-amber-900/30"
                    : "bg-indigo-600 shadow-indigo-200 dark:shadow-indigo-900/30"
                    }`}
                >
                  {loading ? (
                    <><svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>{t('processing')}</>
                  ) : paymentMethod === "bakong_khqr"
                    ? <><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="13" y="3" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="3" y="13" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="2" /><rect x="15" y="15" width="2" height="2" fill="currentColor" /><rect x="19" y="15" width="2" height="2" fill="currentColor" /><rect x="15" y="19" width="2" height="2" fill="currentColor" /><rect x="19" y="19" width="2" height="2" fill="currentColor" /></svg>{t('payWithKHQR') || "Pay with KHQR"}</>
                    : <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{t('placeOrder')}</>
                  }
                </button>
                <Link to="/cart" className="mt-3 w-full rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 py-3 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  {t('backToCart')}
                </Link>
              </div>
            </div>

            {/* trust badges */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">SSL Secured Checkout</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">256-bit encryption. Your data is safe.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Free same-day dispatch</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order before 3 PM. 30-day free returns.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">24/7 Customer support</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">+855 12 345 678 · support@fitandsleek.com</p>
                </div>
              </div>
            </div>

            {/* accepted payment logos ribbon */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 px-5 py-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">We accept</p>
              <div className="flex items-center flex-wrap gap-2">
                {[
                  { label: "VISA", bg: "#1A1F71", color: "#fff" },
                  { label: "MC", bg: "#EB001B", color: "#fff" },
                  { label: "AMEX", bg: "#2557D6", color: "#fff" },
                  { label: "UP", bg: "#DE1F26", color: "#fff" },
                  { label: "KHQR", bg: "#C0272D", color: "#fff" },
                  { label: "BAKONG", bg: "#C88F09", color: "#000" },
                ].map(({ label, bg, color }) => (
                  <span key={label} className="inline-flex items-center h-6 px-2.5 rounded text-[11px] font-bold tracking-wide" style={{ background: bg, color }}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

          </div>{/* end right column */}
        </div>{/* end grid */}
      </div>
      <KhqrSuccessModal
        open={khqrSuccessOpen}
        orderNumber={khqrOrder?.order_number}
        total={khqrOrder?.total}
        currency="KHR"
        redirectSeconds={KHQR_REDIRECT_SECONDS}
        onClose={() => {
          setKhqrSuccessOpen(false);
          nav("/orders");
        }}
      />
      <CheckoutPaymentKhqr
        open={khqrOpen}
        orderId={khqrOrder?.id}
        orderNumber={khqrOrder?.order_number}
        amount={khqrOrder?.total}
        currency={"KHR"}
        onClose={() => setKhqrOpen(false)}
        onPaid={() => {
          setKhqrOpen(false);
          setKhqrSuccessOpen(true);
        }}
      />
    </>
  );
}

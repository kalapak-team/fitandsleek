import React, { useState, useEffect, useCallback, useRef } from "react";
import PaymentSuccessAlert from "../components/alerts/PaymentSuccessAlert";
import KhqrSuccessModal from "../components/alerts/KhqrSuccessModal";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../lib/api";
import BakongKhqrPanel from "../components/payments/BakongKhqrPanel";

const SUCCESS_REDIRECT_SECONDS = 60;

export default function PaymentProcess() {
  const nav = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const cardPrefill = location.state?.cardPrefill;
  const alertShownRef = useRef(false);

  const formatCardNumber = (val = "") => {
    const d = val.replace(/\D/g, "").slice(0, 19);
    return d.match(/.{1,4}/g)?.join(" ") || d;
  };
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [khqrSuccessOpen, setKhqrSuccessOpen] = useState(false);

  useEffect(() => {
    if (!khqrSuccessOpen) return;
    const t = setTimeout(() => nav(`/orders/${orderId}`), SUCCESS_REDIRECT_SECONDS * 1000);
    return () => clearTimeout(t);
  }, [khqrSuccessOpen, nav, orderId]);

  // Card state
  const [cardData, setCardData] = useState(() => ({
    cardNumber: formatCardNumber(cardPrefill?.number || ""),
    cardName: cardPrefill?.name || "",
    expiryDate: cardPrefill?.expiry || "",
    cvv: cardPrefill?.cvc || "",
  }));
  const [cardError, setCardError] = useState("");
  const [cardProcessing, setCardProcessing] = useState(false);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  useEffect(() => {
    if (cardPrefill) {
      setCardData({
        cardNumber: formatCardNumber(cardPrefill.number || ""),
        cardName: cardPrefill.name || "",
        expiryDate: cardPrefill.expiry || "",
        cvv: cardPrefill.cvc || "",
      });
    }
  }, [cardPrefill]);

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setOrder(data.data);
      setLoading(false);
    } catch (e) {
      console.error("Failed to load order", e);
      setLoading(false);
    }
  };

  const handleBakongStatusChange = useCallback((status) => {
    if (status === "paid") {
      setPaymentStatus("success");
      setKhqrSuccessOpen(true);
    }
  }, []);

  const validateCardNumber = (number) => {
    const cleaned = number.replace(/\s/g, "");
    return /^[0-9]{13,19}$/.test(cleaned);
  };

  const validateExpiry = (date) => {
    const cleaned = date.replace(/\D/g, "");
    if (cleaned.length !== 4) return false;
    const month = parseInt(cleaned.substring(0, 2));
    const year = parseInt("20" + cleaned.substring(2, 4));
    if (month < 1 || month > 12) return false;
    const now = new Date();
    return year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
  };

  const validateCVV = (cvv) => {
    return /^[0-9]{3,4}$/.test(cvv.replace(/\D/g, ""));
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setCardError("");

    // Validation
    if (!validateCardNumber(cardData.cardNumber)) {
      setCardError("Invalid card number");
      return;
    }
    if (!validateExpiry(cardData.expiryDate)) {
      setCardError("Invalid expiry date (MM/YY)");
      return;
    }
    if (!validateCVV(cardData.cvv)) {
      setCardError("Invalid CVV");
      return;
    }
    if (!cardData.cardName) {
      setCardError("Cardholder name is required");
      return;
    }

    setCardProcessing(true);

    try {
      // Process payment through backend (which connects to Stripe/payment gateway)
      const response = await api.post(`/payments/${order.id}/process-card`, {
        card_number: cardData.cardNumber.replace(/\s/g, ""),
        card_name: cardData.cardName,
        expiry_date: cardData.expiryDate,
        cvv: cardData.cvv,
      });

      if (response.data.success) {
        setPaymentStatus("success");
        setTimeout(() => {
          nav(`/orders/${orderId}`);
        }, SUCCESS_REDIRECT_SECONDS * 1000);
      } else {
        setCardError(response.data.message || "Payment failed");
      }
    } catch (e) {
      setCardError(e.response?.data?.message || "Payment processing failed");
    } finally {
      setCardProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container-safe py-20 text-center">
        <div className="inline-block">
          <svg className="w-12 h-12 animate-spin text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <p className="mt-4 text-slate-600">Loading payment page...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-safe py-20">
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">Order not found</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
      <div className="container-safe max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">
            Complete Payment
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Order: <span className="font-bold">{order.order_number}</span>
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-8 mb-6">
          {/* Order Summary */}
          <div className="mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Order Total</h2>
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                ${order.total}
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {order.items?.length || 0} items
            </p>
          </div>

          {/* Success State – card only; KHQR uses the overlay modal */}
          {paymentStatus === "success" && order?.payment_method !== "bakong_khqr" && (
            <PaymentSuccessAlert
              orderNumber={order?.order_number}
              total={order?.total}
              currency={order?.currency || "USD"}
            />
          )}

          {/* bKash QR Payment */}
          {order.payment_method === "bakong_khqr" && paymentStatus !== "success" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pay via Bakong KHQR
              </h3>
              <BakongKhqrPanel
                orderId={order.id}
                amount={order.total}
                currency={order.currency || "KHR"}
                onStatusChange={handleBakongStatusChange}
              />
            </div>
          )}

          {/* Card/Visa Payment */}
          {order.payment_method === "card_visa" && paymentStatus !== "success" && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Pay via Card/Visa
              </h3>

              {cardError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
                  {cardError}
                </div>
              )}

              <form onSubmit={handleCardSubmit} className="space-y-4">
                {/* Card Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Card Number
                  </label>
                  <input
                    type="text"
                    placeholder="4532 1234 5678 9010"
                    value={cardData.cardNumber}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, "").slice(0, 16);
                      val = val.replace(/(\d{4})/g, "$1 ").trim();
                      setCardData({ ...cardData, cardNumber: val });
                    }}
                    maxLength="19"
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none transition-all"
                    required
                  />
                </div>

                {/* Cardholder Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={cardData.cardName}
                    onChange={(e) => setCardData({ ...cardData, cardName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none transition-all"
                    required
                  />
                </div>

                {/* Expiry & CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      placeholder="12/25"
                      value={cardData.expiryDate}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        if (val.length >= 2) {
                          val = val.slice(0, 2) + "/" + val.slice(2);
                        }
                        setCardData({ ...cardData, expiryDate: val });
                      }}
                      maxLength="5"
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      CVV
                    </label>
                    <input
                      type="password"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setCardData({ ...cardData, cvv: val });
                      }}
                      maxLength="4"
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-lg focus:border-indigo-500 dark:bg-slate-700 dark:text-white outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Warning */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 text-sm text-amber-700 dark:text-amber-300">
                  ⚠️ This is a demo. In production, use a secure payment gateway like Stripe or Square.
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={cardProcessing}
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {cardProcessing ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Pay $${order.total}`
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>Secure payment processing • Your data is encrypted</p>
        </div>
      </div>
    </div>

    {/* KHQR success overlay */}
    <KhqrSuccessModal
      open={khqrSuccessOpen}
      orderNumber={order?.order_number}
      total={order?.total}
      currency={order?.currency || "KHR"}
      redirectSeconds={SUCCESS_REDIRECT_SECONDS}
      onClose={() => {
        setKhqrSuccessOpen(false);
        nav(`/orders/${orderId}`);
      }}
    />
    </>
  );
}

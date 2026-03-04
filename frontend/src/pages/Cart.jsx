import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../state/cart";
import { useAuth } from "../state/auth";
import { resolveImageUrl } from "../lib/images";
import { useLanguage } from "../lib/i18n.jsx";

function Money({ value }) {
  const n = Number(value || 0);
  return <span>${n.toFixed(2)}</span>;
}

export default function CartPage() {
  const { cart, total, loading, updateQty, remove } = useCart();
  const items = cart?.items || [];
  const { t } = useLanguage();
  const { user } = useAuth();

  const getPriceMeta = (item) => {
    const unitPaid = Number(item?.unit_price || item?.product?.final_price || item?.product?.price || 0);
    const unitOriginal = Number(item?.product?.price || unitPaid);
    const qty = Number(item?.quantity) || 0;
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

  return (
    <div className="container-safe py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Cart</h1>
          <p className="mt-1 text-sm text-zinc-600">{t('cartSubtitle')}</p>
        </div>
        <Link to="/search" className="text-sm font-semibold text-zinc-700 hover:underline">
          {t('continueShopping')}
        </Link>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 fs-card p-5">
          {loading ? (
            <div className="text-sm text-zinc-600">{t('loading')}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-zinc-600">
              {t('cartEmpty')} <Link to="/search" className="underline">{t('shopProducts')}</Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((it) => {
                const pricing = getPriceMeta(it);
                return (
                <div key={it.id} className="flex gap-4 border-b border-zinc-200 pb-4 last:border-b-0 last:pb-0">
                  <Link
                    to={it.product?.slug ? `/p/${it.product.slug}` : "/search"}
                    className="h-20 w-20 rounded-2xl border border-zinc-200 overflow-hidden bg-zinc-50 shrink-0"
                  >
                    <img
                      src={resolveImageUrl(it.product?.image_url)}
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                      alt={it.product?.name || ""}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to={it.product?.slug ? `/p/${it.product.slug}` : "/search"}
                          className="font-semibold hover:text-zinc-600"
                        >
                          {it.product?.name}
                        </Link>
                        <div className="mt-1 text-xs text-zinc-600">{it.product?.category?.name}</div>
                        {it.size ? (
                          <div className="mt-1 text-xs text-zinc-500">
                            {t('size')} {it.size}
                          </div>
                        ) : null}
                        {it.color ? (
                          <div className="mt-1 text-xs text-zinc-500">
                            Color: {it.color}
                          </div>
                        ) : null}
                      </div>

                      <button className="text-xs text-rose-600 hover:underline" onClick={() => remove(it.id)}>
                        {t('remove')}
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-zinc-200">
                        <button className="h-10 sm:h-12 w-10 sm:w-12 text-base" onClick={() => updateQty(it.id, Math.max(1, (it.quantity || 1) - 1))}>−</button>
                        <div className="w-10 sm:w-12 text-center text-sm sm:text-base font-semibold">{it.quantity}</div>
                        <button className="h-10 sm:h-12 w-10 sm:w-12 text-base" onClick={() => updateQty(it.id, (it.quantity || 1) + 1)}>+</button>
                      </div>

                      <div className="text-right">
                        {pricing.hasDiscount && (
                          <div className="text-xs text-zinc-400 line-through">
                            <Money value={pricing.lineOriginal} />
                          </div>
                        )}
                        <div className="text-sm sm:text-base font-black">
                          <Money value={pricing.linePaid} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        <div className="fs-card p-5 h-fit">
          <div className="text-xs font-black tracking-wide">{t('summary')}</div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-zinc-600">{t('subtotal')}</span>
            <span className="font-black"><Money value={total} /></span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-zinc-600">{t('shipping')}</span>
            <span className="font-semibold">$0.00</span>
          </div>
          <div className="mt-4 border-t border-zinc-200 pt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-zinc-700">{t('total')}</span>
            <span className="text-lg font-black"><Money value={total} /></span>
          </div>

          <Link
            to="/checkout"
            onClick={(e) => {
              if (user) return;
              e.preventDefault();
              window.dispatchEvent(new Event("fs:open-login"));
            }}
            className="mt-5 w-full rounded-xl bg-black text-white py-4 font-bold hover:opacity-90 active:scale-95 transition-all duration-200 flex items-center justify-center"
          >
            {t('checkout')}
          </Link>

          <p className="mt-3 text-[11px] text-zinc-500">
            {t('checkoutNoteStart')} <code className="font-mono">POST /api/checkout</code> {t('checkoutNoteEnd')}
          </p>
        </div>
      </div>
    </div>
  );
}

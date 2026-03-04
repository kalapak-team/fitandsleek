import React from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../../state/cart";
import { useAuth } from "../../state/auth";
import { resolveImageUrl } from "../../lib/images";

function Money({ value }) {
  const n = Number(value || 0);
  return <span>${n.toFixed(2)}</span>;
}

export default function CartDrawer({ open, onClose }) {
  const { cart, total, loading, updateQty, remove } = useCart();
  const items = cart?.items || [];
  const { user } = useAuth();

  const getPriceMeta = (item) => {
    const unitPaid = Number(item?.unit_price || item?.product?.final_price || item?.product?.price || 0);
    const unitOriginal = Number(item?.product?.price || unitPaid);
    return {
      unitPaid,
      unitOriginal,
      hasDiscount: unitOriginal > unitPaid,
    };
  };

  return (
    <div className={open ? "fixed inset-0 z-50" : "hidden"} aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300">
        <div className="h-16 px-6 border-b border-zinc-200 flex items-center justify-between">
          <div className="text-base font-black tracking-tight">Your Cart</div>
          <button onClick={onClose} className="h-9 w-9 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors flex items-center justify-center">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-5">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-zinc-600">
              Cart is empty. <Link to="/search" className="underline" onClick={onClose}>Shop products</Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {items.map((it) => {
                const pricing = getPriceMeta(it);
                return (
                <div key={it.id} className="flex gap-3 rounded-2xl border border-zinc-200/60 p-3 bg-white/90">
                  <Link
                    to={it.product?.slug ? `/p/${it.product.slug}` : "/search"}
                    onClick={onClose}
                    className="h-16 w-16 rounded-xl border border-zinc-200 overflow-hidden bg-zinc-50 shrink-0"
                  >
                    <img
                      src={resolveImageUrl(it.product?.image_url)}
                      alt={it.product?.name || ""}
                      className="w-full h-full object-cover transition-transform duration-200 hover:scale-[1.03]"
                      onError={(e) => (e.currentTarget.src = "/placeholder.svg")}
                    />
                  </Link>

                  <div className="flex-1">
                    <Link
                      to={it.product?.slug ? `/p/${it.product.slug}` : "/search"}
                      onClick={onClose}
                      className="text-sm font-semibold line-clamp-1 hover:text-zinc-600 transition-colors"
                    >
                      {it.product?.name}
                    </Link>
                    <div className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                      <Money value={pricing.unitPaid} />
                      {pricing.hasDiscount && (
                        <span className="text-zinc-400 line-through">
                          <Money value={pricing.unitOriginal} />
                        </span>
                      )}
                      <span>· {it.product?.category?.name || "Category"}</span>
                    </div>
                    {(it.size || it.color) && (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {it.size ? `Size: ${it.size}` : ""}
                        {it.size && it.color ? " · " : ""}
                        {it.color ? `Color: ${it.color}` : ""}
                      </div>
                    )}

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        className="h-8 w-8 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
                        onClick={() => updateQty(it.id, Math.max(1, (it.quantity || 1) - 1))}
                      >
                        −
                      </button>
                      <div className="text-sm font-semibold w-8 text-center">{it.quantity}</div>
                      <button className="h-8 w-8 rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors" onClick={() => updateQty(it.id, (it.quantity || 1) + 1)}>
                        +
                      </button>

                      <button className="ml-auto text-xs text-rose-600 hover:underline" onClick={() => remove(it.id)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200 px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">Subtotal</span>
            <span className="font-black">
              <Money value={total} />
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link onClick={onClose} to="/cart" className="h-11 rounded-full border border-zinc-200 hover:bg-zinc-50 flex items-center justify-center text-sm font-semibold transition-colors">
              View Cart
            </Link>
            <Link
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  window.dispatchEvent(new Event("fs:open-login"));
                  return;
                }
                onClose();
              }}
              to="/checkout"
              className="h-11 rounded-full bg-zinc-950 hover:bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold transition-colors"
            >
              Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

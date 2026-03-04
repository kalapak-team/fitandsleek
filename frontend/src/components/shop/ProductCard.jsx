import React, { useState } from "react";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { resolveImageUrl } from "../../lib/images";
import { useWishlist } from "../../state/wishlist";
import { useCart } from "../../state/cart";
import { useAuth } from "../../state/auth";
import { errorAlert } from "../../lib/swal";

function Money({ value }) {
  const n = Number(value || 0);
  return <span>${n.toFixed(2)}</span>;
}

export default function ProductCard({ p }) {
  const [imgOk, setImgOk] = useState(true);
  const wishlist = useWishlist();
  const cart = useCart();
  const { user } = useAuth();

  const addToCart = async () => {
    try {
      const sizes = Array.isArray(p?.sizes)
        ? p.sizes
        : typeof p?.sizes === "string"
          ? p.sizes.split(",").map((s) => s.trim()).filter(Boolean)
          : [];
      const colors = Array.isArray(p?.colors)
        ? p.colors
        : typeof p?.colors === "string"
          ? p.colors.split(",").map((c) => c.trim()).filter(Boolean)
          : [];
      if (sizes.length > 0) {
        await errorAlert({
          khTitle: "សូមជ្រើសទំហំ",
          enTitle: "Select size",
          khText: "សូមជ្រើសទំហំនៅលើទំព័រទំនិញ",
          enText: "Please select a size on the product page.",
        });
        if (p?.slug) window.location.href = `/p/${p.slug}`;
        return;
      }
      if (colors.length > 0) {
        await errorAlert({
          khTitle: "សូមជ្រើសពណ៌",
          enTitle: "Select color",
          khText: "សូមជ្រើសពណ៌នៅលើទំព័រទំនិញ",
          enText: "Please select a color on the product page.",
        });
        if (p?.slug) window.location.href = `/p/${p.slug}`;
        return;
      }
      await cart.add(p, 1);
    } catch (e) {
      if (String(e?.message || "").includes("LOGIN_REQUIRED")) {
        window.location.href = "/login";
        return;
      }
    }
  };

  const src = imgOk ? resolveImageUrl(p.image_url) : "/placeholder.svg";

  const discountPrice =
    p.discount_price ?? p.discount?.sale_price ?? p.activeSale?.sale_price ?? null;
  const discountPercentage =
    p.discount_percentage ??
    p.discount?.discount_percentage ??
    (p.discount?.type === "percentage" ? Number(p.discount?.value || 0) : null);
  const hasDiscount =
    Boolean(p.has_discount) ||
    (discountPrice !== null && Number(discountPrice) > 0 && Number(discountPrice) < Number(p.price || 0));

  const badge = hasDiscount
    ? discountPercentage && Number(discountPercentage) > 0
      ? `Discount ${Math.round(Number(discountPercentage))}%`
      : "Discount"
    : (p.old_price ? "SALE" : null);

  const displayPrice = hasDiscount ? discountPrice : (p.final_price ?? p.price);
  const originalPrice = hasDiscount ? p.price : p.old_price;

  return (
    <div className="fs-card group overflow-hidden !rounded-none border border-gray-200 bg-white">
      <div className="relative bg-zinc-50 overflow-hidden">
        <Link to={`/p/${p.slug}`} className="block aspect-[4/5] overflow-hidden">
          <img
            src={src}
            alt={p.name}
            onError={() => setImgOk(false)}
            className="w-full h-full object-cover"
          />
        </Link>

        <button
          onClick={() => wishlist.toggle(p.id)}
          className={
            `absolute top-2 right-2 h-8 w-8 sm:h-9 sm:w-9 rounded-full border flex items-center justify-center ` +
            (wishlist.has(p.id)
              ? "bg-zinc-900 text-white border-zinc-900"
              : "bg-white/95 border-zinc-200") +
            " opacity-0 translate-y-1 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto"
          }
          aria-label="Wishlist"
          title="Wishlist"
        >
          <Heart
            className="w-4 h-4 sm:w-5 sm:h-5"
            strokeWidth={1.5}
            fill={wishlist.has(p.id) ? "currentColor" : "none"}
          />
        </button>

        {/* Badges Container - Stacked Vertically */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {badge && (
            <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
              {badge}
            </div>
          )}

          {hasDiscount && (p.discount?.end_date || p.activeSale?.end_date) && (
            <div className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">
              Limited Time
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="flex items-center gap-2">
          {originalPrice && (
            <div className="text-[11px] text-zinc-500 line-through">
              <Money value={originalPrice} />
            </div>
          )}
          <div className={`text-sm font-black ${originalPrice ? "text-rose-600" : "text-slate-900"}`}>
            <Money value={displayPrice} />
          </div>
        </div>

        <Link
          to={`/p/${p.slug}`}
          className="mt-1.5 text-sm font-semibold text-zinc-900 line-clamp-2 hover:text-[#F2A65A]"
        >
          {p.name}
        </Link>

        <div className="mt-2 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-zinc-900" />
          <span className="h-2 w-2 rounded-full bg-zinc-400" />
          <span className="h-2 w-2 rounded-full bg-zinc-200" />
        </div>

        {!user ? (
          <div className="mt-2 text-[11px] text-zinc-500">Login required for cart & checkout</div>
        ) : null}
      </div>
    </div>
  );
}

import React from "react";

export default function ProductSaleTag({ sale }) {
  if (!sale || !sale.is_active) return null;

  const now = new Date();
  const startDate = new Date(sale.start_date);
  const endDate = new Date(sale.end_date);

  if (now < startDate || now > endDate) return null;

  const discount = sale.discount_value;
  const discountType = sale.discount_type;

  let discountLabel = "";
  if (discountType === "percentage") {
    discountLabel = `${discount}%`;
  } else {
    discountLabel = `$${parseFloat(discount).toFixed(2)}`;
  }

  return (
    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10 flex items-center gap-1">
      <span>🔥</span>
      <span>{discountLabel}</span>
    </div>
  );
}

import React from "react";

export default function SaleBadge({ sale }) {
  if (!sale || !sale.is_active) return null;

  const now = new Date();
  const startDate = new Date(sale.start_date);
  const endDate = new Date(sale.end_date);

  if (now < startDate || now > endDate) return null;

  const originalPrice = sale.product?.price;
  const discount = sale.discount_value;
  const discountType = sale.discount_type;

  let discountLabel = "";
  if (discountType === "percentage") {
    discountLabel = `${discount}% OFF`;
  } else {
    discountLabel = `$${parseFloat(discount).toFixed(2)} OFF`;
  }

  return (
    <div className="relative">
      {/* Sale Badge */}
      <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold z-10">
        {discountLabel}
      </div>

      {/* Sale Info */}
      <div className="bg-yellow-50 border border-yellow-300 p-4 rounded-lg mb-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold text-gray-700">SALE PRICE</p>
            <p className="text-2xl font-bold text-red-600">${parseFloat(sale.sale_price).toFixed(2)}</p>
            <p className="text-sm text-gray-600 line-through">Original: ${parseFloat(originalPrice).toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-600">Sale Ends:</p>
            <p className="text-sm font-semibold text-gray-800">
              {new Date(sale.end_date).toLocaleDateString()}
            </p>
          </div>
        </div>
        {sale.description && (
          <p className="text-xs text-gray-700 mt-2 italic">{sale.description}</p>
        )}
      </div>
    </div>
  );
}

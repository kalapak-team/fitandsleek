import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard.jsx";

export default function Section({ title, to, items, loading, showDiscount = false }) {
  return (
    <section className="container-safe mt-8 md:mt-10 lg:mt-12 max-w-[1600px] mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base md:text-lg lg:text-xl 2xl:text-2xl font-bold tracking-tight text-zinc-900">{title}</h2>
        <Link to={to} className="fs-pill text-xs sm:text-sm">
          View all
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="fs-card overflow-hidden">
                <div className="aspect-[4/5] bg-zinc-100 animate-pulse" />
                <div className="p-3 sm:p-4">
                  <div className="h-3 w-2/3 bg-zinc-100 animate-pulse rounded" />
                  <div className="mt-2 h-3 w-1/3 bg-zinc-100 animate-pulse rounded" />
                  <div className="mt-3 h-7 w-20 bg-zinc-100 animate-pulse rounded-full" />
                </div>
              </div>
            ))
          : items.map((p) => <ProductCard key={p.id} p={p} showDiscount={showDiscount} />)}
      </div>
    </section>
  );
}

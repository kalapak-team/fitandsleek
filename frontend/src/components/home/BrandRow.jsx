import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

function BrandLogo({ name, logo_url }) {
  return (
    <div className="h-14 w-28 flex items-center justify-center transition-transform duration-300 hover:-translate-y-0.5">
      {logo_url ? (
        <img
          src={logo_url}
          alt={name}
          className="h-10 w-auto object-contain transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-black tracking-tight text-zinc-900">
          {name}
        </span>
      )}
    </div>
  );
}

export default function BrandRow() {
  const [items, setItems] = useState([]);
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get("/brands");
      setItems(data?.data || []);
    } catch {
      // keep silent on homepage
      setItems([]);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const canScroll = items.length > 0;

  const scrollBy = (dir) => {
    const el = scrollerRef.current;
    if (!el) return;
    const amount = Math.max(240, Math.floor(el.clientWidth * 0.6));
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
    requestAnimationFrame(() => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const isScrollable = maxScroll > 4;
      setCanScrollLeft(isScrollable && el.scrollLeft > 4);
      setCanScrollRight(isScrollable && el.scrollLeft < maxScroll - 4);
    });
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;

    const updateArrows = () => {
      const maxScroll = el.scrollWidth - el.clientWidth;
      const isScrollable = maxScroll > 4;
      setCanScrollLeft(isScrollable && el.scrollLeft > 4);
      setCanScrollRight(isScrollable && el.scrollLeft < maxScroll - 4);
    };

    updateArrows();
    const id = setTimeout(updateArrows, 50);
    const onScroll = () => updateArrows();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateArrows);

    return () => {
      clearTimeout(id);
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateArrows);
    };
  }, [items]);

  const viewAllHref = useMemo(() => "/search", []);
  return (
    <section className="container-safe mt-8 max-w-[1600px] mx-auto">
      <div className="mt-4 relative">
        {/* Left / Right Controls */}
        {canScroll && (
          <>
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className={`absolute left-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 shadow-sm border border-zinc-200 hover:bg-white transition-all duration-200 ease-out ${
                canScrollLeft ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              }`}
              aria-label="Scroll left"
              aria-hidden={!canScrollLeft}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-white/90 shadow-sm border border-zinc-200 hover:bg-white transition-all duration-200 ease-out ${
                canScrollRight ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
              }`}
              aria-label="Scroll right"
              aria-hidden={!canScrollRight}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        <div
          ref={scrollerRef}
          data-hide-scrollbar
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          className="flex items-center gap-10 overflow-x-auto pb-2 px-10 md:px-12 brand-scroll scrollbar-hide scroll-smooth"
        >
          {items.map((b) => (
            <div key={b.id} className="shrink-0">
              <Link
                to={b.slug ? `/brands/${b.slug}` : `/search?q=${encodeURIComponent(b.name)}`}
                className="block"
              >
                <BrandLogo name={b.name} logo_url={b.logo_url} />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

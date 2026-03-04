import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/shop/ProductCard.jsx";
import { useLanguage } from "../lib/i18n.jsx";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function BrandDetail() {
  const { slug } = useParams();
  const qs = useQuery();
  const nav = useNavigate();
  const { t } = useLanguage();

  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ data: [], meta: null });
  const [page, setPage] = useState(Number(qs.get("page") || 1));

  useEffect(() => setPage(Number(qs.get("page") || 1)), [qs]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: brandData } = await api.get(`/brands/${slug}`);
        if (active) setBrand(brandData);
      } catch {
        if (active) setBrand(null);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get("/products", {
          params: { brand_slug: slug, page },
        });
        if (active) setData(res.data || { data: [] });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug, page]);

  const products = useMemo(() => data?.data || [], [data]);
  const meta = data?.meta || null;
  const lastPage = data?.last_page || meta?.last_page || 1;

  const changePage = (nextPage) => {
    const n = new URLSearchParams(qs);
    n.set("page", String(nextPage));
    nav(`/brands/${slug}?${n.toString()}`);
  };

  return (
    <div className="container-safe py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {t("brand")}: {brand?.name || slug}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {t("productsByBrand")}
          </p>
        </div>
        {brand?.logo_url && (
          <img
            src={brand.logo_url}
            alt={brand.name}
            className="h-12 w-auto object-contain"
            loading="lazy"
          />
        )}
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="text-zinc-500">Loading...</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500">
            {t("noProductsFound")}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {lastPage > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => changePage(page - 1)}
            className="h-10 px-4 rounded-full border border-zinc-200 disabled:opacity-40"
          >
            {t("prev")}
          </button>
          <div className="text-sm text-zinc-700">
            {t("page")} <span className="font-semibold">{page}</span> /{" "}
            <span className="font-semibold">{lastPage}</span>
          </div>
          <button
            disabled={page >= lastPage}
            onClick={() => changePage(page + 1)}
            className="h-10 px-4 rounded-full border border-zinc-200 disabled:opacity-40"
          >
            {t("next")}
          </button>
        </div>
      )}
    </div>
  );
}

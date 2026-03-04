import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import ProductCard from "../components/shop/ProductCard.jsx";
import { useWishlist } from "../state/wishlist.jsx";
import { Camera, Image as ImageIcon, Sparkles } from "lucide-react";
import { useLanguage } from "../lib/i18n.jsx";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Shop() {
  const qs = useQuery();
  const nav = useNavigate();
  const wishlist = useWishlist();
  const { t } = useLanguage();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(Number(qs.get("page") || 1));
  const [data, setData] = useState({ data: [], meta: null });
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const q = qs.get("q") || "";
  const gender = qs.get("gender") || "";
  const categoryId = qs.get("category_id") || "";
  const parentCategory = qs.get("parent_category") || "";
  const tab = qs.get("tab") || "";
  const imageSearchParam = qs.get("image_search");
  const colorsParam = qs.get("colors");

  // Initialize image search from URL params
  useEffect(() => {
    if (imageSearchParam === "1" && colorsParam) {
      try {
        const colors = JSON.parse(decodeURIComponent(colorsParam));
        setImageSearchResults({ colors });
        loadSuggestions();
      } catch (e) {
        console.error("Failed to parse colors from URL:", e);
      }
    }
  }, [imageSearchParam, colorsParam]);

  useEffect(() => setPage(Number(qs.get("page") || 1)), [qs]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/categories");
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  // Load suggestions when image search is active
  useEffect(() => {
    if (imageSearchResults) {
      loadSuggestions();
    }
  }, [imageSearchResults]);

  const loadSuggestions = async () => {
    try {
      // Get random/featured products as suggestions
      const { data: productsData } = await api.get("/products", {
        params: { limit: 4, random: true }
      });
      const products = productsData?.data || productsData || [];
      // Ensure we have at least 4 products
      if (products.length < 4) {
        const allProducts = products;
        while (allProducts.length < 4) {
          allProducts.push(...products);
        }
        setSuggestions(allProducts.slice(0, 4));
      } else {
        setSuggestions(products.slice(0, 4));
      }
    } catch {
      setSuggestions([]);
    }
  };

  const parentCollectionLabel = useMemo(() => {
    if (!parentCategory) return "";

    const normalized = parentCategory.toLowerCase();
    if (normalized === "men") return "All Men's Collection";
    if (normalized === "women") return "All Women's Collection";
    if (normalized === "boys") return "All Boys' Collection";
    if (normalized === "girls") return "All Girls' Collection";

    return `All ${parentCategory} Collection`;
  }, [parentCategory]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = { page };
        if (q) params.q = q;
        if (gender && gender !== "sale") params.gender = gender;
        if (categoryId) params.category_id = categoryId;
        if (parentCategory) params.parent_category = parentCategory;
        if (imageSearchResults?.colors) {
          params.colors = JSON.stringify(imageSearchResults.colors);
        }
        const res = await api.get("/products", { params });
        setData(res.data || { data: [] });
      } finally {
        setLoading(false);
      }
    })();
  }, [q, gender, categoryId, parentCategory, page, imageSearchResults]);

  const products = useMemo(() => {
    const list = data?.data || [];
    if (tab === "wishlist") return list.filter((p) => wishlist.has(p.id));
    return list;
  }, [data, tab, wishlist]);

  const change = (next, options = {}) => {
    const { clearImageSearch: shouldClearImageSearch = false } = options;
    const n = new URLSearchParams(qs);
    Object.entries(next).forEach(([k, v]) => {
      if (v === "" || v == null) n.delete(k);
      else n.set(k, String(v));
    });
    if (shouldClearImageSearch) {
      n.delete("image_search");
      n.delete("colors");
      setImageSearchResults(null);
      setSuggestions([]);
    }
    n.delete("page");
    nav(`/shop?${n.toString()}`);
  };

  const handleImageSearch = async ({ image, colors }) => {
    setImageSearchResults({ image, colors });
    setShowImageSearch(false);
    
    // Navigate to shop page with image search params
    const encodedColors = encodeURIComponent(JSON.stringify(colors));
    nav(`/shop?image_search=1&colors=${encodedColors}`);
  };

  const clearImageSearch = () => {
    setImageSearchResults(null);
    setSuggestions([]);
    // Remove image search params from URL
    const n = new URLSearchParams(qs);
    n.delete("image_search");
    n.delete("colors");
    nav(`/shop?${n.toString()}`, { replace: true });
  };

  const meta = data?.meta || null;
  const lastPage = data?.last_page || meta?.last_page || 1;

  const clearCollectionChip = () => {
    setImageSearchResults(null);
    setSuggestions([]);
    nav("/shop");
  };

  return (
    <div className="container-safe py-8">
      <div className="flex flex-col md:flex-row md:items-end gap-4 justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {imageSearchResults ? t('similarItems') : t('shop')}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {imageSearchResults 
              ? t('itemsMatchingImageSearch')
              : t('searchFilterProducts')}
          </p>
          {parentCollectionLabel && (
            <div className="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700 gap-2">
              <span>🧩 {parentCollectionLabel}</span>
              <button
                type="button"
                onClick={clearCollectionChip}
                className="hover:text-red-600"
                aria-label="Clear collection"
                title="Clear collection"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => {
              change({ q: e.target.value }, { clearImageSearch: true });
            }}
            placeholder={t('searchProducts')}
            className="h-10 w-64 max-w-full rounded-full border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-300"
          />

          <select
            value={gender}
            onChange={(e) => {
              const selected = e.target.value;
              const parentMap = {
                men: 'Men',
                women: 'Women',
                boys: 'Boys',
                girls: 'Girls',
              };

              if (selected && parentMap[selected]) {
                change({ parent_category: parentMap[selected], gender: '', category_id: '' }, { clearImageSearch: true });
              } else {
                change({ gender: selected, parent_category: '', category_id: '' }, { clearImageSearch: true });
              }
            }}
            className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm outline-none"
          >
            <option value="">{t('all')}</option>
            <option value="women">{t('women')}</option>
            <option value="men">{t('men')}</option>
            <option value="boys">{t('boys')}</option>
            <option value="girls">{t('girls')}</option>
            <option value="sale">{t('sale')}</option>
          </select>

          <select
            value={categoryId}
            onChange={(e) => {
              change({ category_id: e.target.value, parent_category: '' }, { clearImageSearch: true });
            }}
            className="h-10 rounded-full border border-zinc-200 bg-white px-3 text-sm outline-none"
          >
            <option value="">{t('allCategories')}</option>
            {categories && Array.isArray(categories) && categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => change({ tab: tab === "wishlist" ? "" : "wishlist" })}
            className={[
              "h-10 sm:h-12 rounded-full border px-4 sm:px-6 text-sm sm:text-base font-semibold",
              tab === "wishlist" ? "border-zinc-950 bg-zinc-950 text-white" : "border-zinc-200 bg-white hover:bg-zinc-50",
            ].join(" ")}
          >
            {t('wishlist')}
          </button>

          <Link
            to="/cart"
            className="h-10 sm:h-12 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-4 sm:px-6 text-sm sm:text-base font-semibold flex items-center"
          >
            {t('cart')}
          </Link>
        </div>
      </div>

      {/* Image Search Results Info */}
      {imageSearchResults && (
        <div className="mt-4 p-4 bg-purple-50 rounded-2xl flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-white">
            <img
              src={imageSearchResults.image}
              alt={t('searchImageAlt')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="font-medium text-purple-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t('searchingSimilarItems')}
            </p>
            <p className="text-sm text-purple-600">
              {products.length} {t('productsFoundMatchingImage')}
            </p>
          </div>
          <button
            onClick={() => setShowImageSearch(true)}
            className="px-3 sm:px-4 py-2 bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            {t('tryDifferent')}
          </button>
        </div>
      )}

      <div className="mt-6 max-w-[1600px] mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="fs-card overflow-hidden">
                <div className="aspect-square bg-zinc-100 animate-pulse" />
                <div className="p-3">
                  <div className="h-3 w-2/3 bg-zinc-100 animate-pulse rounded" />
                  <div className="mt-2 h-3 w-1/3 bg-zinc-100 animate-pulse rounded" />
                  <div className="mt-3 h-7 w-20 bg-zinc-100 animate-pulse rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="fs-card p-10 text-center text-sm text-zinc-600">
            {imageSearchResults ? (
              <div className="space-y-4">
                <p>{t('noMatchingProductsForImage')}</p>
                
                {/* Fallback Suggestions */}
                <div className="mt-8">
                  <p className="font-medium text-zinc-800 mb-4 flex items-center justify-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    {t('noImageTryThese')}
                  </p>
                  {suggestions.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                      {suggestions.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => change({ q: p.name })}
                          className="cursor-pointer group"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden bg-zinc-100 mb-2">
                            <img
                              src={p.image_url || p.image}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-sm font-medium truncate">{p.name}</p>
                          <p className="text-sm text-zinc-500">${p.price}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-zinc-400">{t('loadingSuggestions')}</p>
                  )}
                </div>
              </div>
            ) : (
              t('noProductsFound')
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!imageSearchResults && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => nav(`/shop?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page - 1) }).toString()}`)}
            className="h-10 sm:h-12 px-4 sm:px-6 rounded-full border border-zinc-200 disabled:opacity-40 text-sm sm:text-base font-medium"
          >
            {t('prev')}
          </button>
          <div className="text-sm sm:text-base text-zinc-700">
            {t('page')} <span className="font-semibold">{page}</span> / <span className="font-semibold">{lastPage}</span>
          </div>
          <button
            disabled={page >= lastPage}
            onClick={() => nav(`/shop?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page + 1) }).toString()}`)}
            className="h-10 sm:h-12 px-4 sm:px-6 rounded-full border border-zinc-200 disabled:opacity-40 text-sm sm:text-base font-medium"
          >
            {t('next')}
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useMemo, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../lib/api";
import { resolveImageUrl } from "../lib/images.js";
import ProductCard from "../components/shop/ProductCard.jsx";
import { useWishlist } from "../state/wishlist.jsx";
import { Camera, Image as ImageIcon, Sparkles, Search as SearchIcon } from "lucide-react";
import { useLanguage } from "../lib/i18n.jsx";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function Search() {
  const qs = useQuery();
  const location = useLocation();
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

  const [searchAutocompleteSuggestions, setSearchAutocompleteSuggestions] = useState([]);
  const [showAutocompleteSuggestions, setShowAutocompleteSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [localSearchQuery, setLocalSearchQuery] = useState(q);
  const autocompleteTimeoutRef = useRef(null);

  // Initialize image search from navigation state or storage
  useEffect(() => {
    const stateResults = location?.state?.imageSearchResults;
    if (stateResults?.colors) {
      setImageSearchResults(stateResults);
      return;
    }
    try {
      const stored = sessionStorage.getItem("image_search_results");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.colors) setImageSearchResults(parsed);
      }
    } catch {
      // ignore storage errors
    }
  }, [location]);

  // Initialize image search from URL params
  useEffect(() => {
    if (imageSearchParam === "1" && colorsParam) {
      try {
        const colors = JSON.parse(decodeURIComponent(colorsParam));
        setImageSearchResults((prev) => ({ ...prev, colors }));
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

  // Fetch autocomplete suggestions for search input
  const fetchAutocompleteSuggestions = async (searchTerm) => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSearchAutocompleteSuggestions([]);
      setShowAutocompleteSuggestions(false);
      return;
    }

    try {
      const { data } = await api.get("/products", {
        params: { q: searchTerm, per_page: 8 }
      });
      const products = data?.data || data || [];
      setSearchAutocompleteSuggestions(products.slice(0, 8));
      setShowAutocompleteSuggestions(products.length > 0);
    } catch (error) {
      console.error("Failed to fetch autocomplete suggestions:", error);
      setSearchAutocompleteSuggestions([]);
      setShowAutocompleteSuggestions(false);
    }
  };

  // Handle search input with debouncing
  const handleSearchInputChange = (value) => {
    setLocalSearchQuery(value);
    setSelectedSuggestionIndex(-1);
    
    // Clear previous timeout
    if (autocompleteTimeoutRef.current) {
      clearTimeout(autocompleteTimeoutRef.current);
    }

    // Debounce API call
    autocompleteTimeoutRef.current = setTimeout(() => {
      fetchAutocompleteSuggestions(value);
    }, 300);
  };

  // Handle keyboard navigation in autocomplete
  const handleAutocompleteKeyDown = (e) => {
    if (!showAutocompleteSuggestions || searchAutocompleteSuggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => 
        prev < searchAutocompleteSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      const selected = searchAutocompleteSuggestions[selectedSuggestionIndex];
      if (selected) {
        nav(`/p/${selected.slug}`);
      }
    } else if (e.key === "Escape") {
      setShowAutocompleteSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  // Select autocomplete suggestion
  const selectAutocompleteSuggestion = (product) => {
    setShowAutocompleteSuggestions(false);
    setSearchAutocompleteSuggestions([]);
    nav(`/p/${product.slug}`);
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <strong key={i} className="font-extrabold text-zinc-900 bg-yellow-100/50 px-0.5 rounded">{part}</strong>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Sync local query with URL query
  useEffect(() => {
    setLocalSearchQuery(q);
  }, [q]);

  useEffect(() => {
    (async () => {
      if (imageSearchResults?.items && Array.isArray(imageSearchResults.items)) {
        setData({ data: imageSearchResults.items, meta: null });
        setLoading(false);
        return;
      }

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

  const parentCollectionLabel = useMemo(() => {
    if (!parentCategory) return "";

    const normalized = parentCategory.toLowerCase();
    if (normalized === "men") return "All Men's Collection";
    if (normalized === "women") return "All Women's Collection";
    if (normalized === "boys") return "All Boys' Collection";
    if (normalized === "girls") return "All Girls' Collection";

    return `All ${parentCategory} Collection`;
  }, [parentCategory]);

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
      try {
        sessionStorage.removeItem("image_search_results");
      } catch {
        // ignore storage errors
      }
    }
    n.delete("page");
    nav(`/search?${n.toString()}`);
  };

  const handleImageSearch = async ({ image, colors }) => {
    setImageSearchResults({ image, colors });
    setShowImageSearch(false);
    
    // Navigate to search page with image search params
    const encodedColors = encodeURIComponent(JSON.stringify(colors));
    nav(`/search?image_search=1&colors=${encodedColors}`);
  };

  const clearImageSearch = () => {
    setImageSearchResults(null);
    setSuggestions([]);
    try {
      sessionStorage.removeItem("image_search_results");
    } catch {
      // ignore storage errors
    }
    // Remove image search params from URL
    const n = new URLSearchParams(qs);
    n.delete("image_search");
    n.delete("colors");
    nav(`/search?${n.toString()}`, { replace: true });
  };

  const meta = data?.meta || null;
  const lastPage = data?.last_page || meta?.last_page || 1;

  return (
    <div className="container-safe py-6 md:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">
          {imageSearchResults ? t('similarItems') : t('shop')}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {imageSearchResults 
            ? t('itemsMatchingImageSearch')
            : t('searchFilterProducts')}
        </p>
        {parentCollectionLabel && (
          <p className="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
            View All • {parentCollectionLabel}
          </p>
        )}
      </div>

      {/* Search & Filters - Mobile Responsive */}
      <div className="bg-white rounded-2xl p-4 md:p-6 border border-zinc-200 mb-6">
        {/* Search Input - Full Width on Mobile */}
        <div className="mb-4 relative">
          <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">
            {t('searchProducts')}
          </label>
          <input
            type="text"
            value={localSearchQuery}
            onChange={(e) => {
              handleSearchInputChange(e.target.value);
            }}
            onKeyDown={handleAutocompleteKeyDown}
            onBlur={() => {
              // Delay hiding to allow click on suggestions
              setTimeout(() => setShowAutocompleteSuggestions(false), 200);
            }}
            onFocus={() => {
              if (localSearchQuery.trim().length >= 2 && searchAutocompleteSuggestions.length > 0) {
                setShowAutocompleteSuggestions(true);
              }
            }}
            placeholder={t('searchProducts') || "Search items..."}
            className="w-full h-11 rounded-full border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition-all"
            autoComplete="off"
          />

          {/* Autocomplete Suggestions Dropdown */}
          {showAutocompleteSuggestions && searchAutocompleteSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200/80 max-h-[320px] overflow-hidden z-50 backdrop-blur-sm">
              <div className="overflow-y-auto max-h-[320px] py-2">
                {searchAutocompleteSuggestions.map((product, index) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectAutocompleteSuggestion(product)}
                    className={`w-full px-5 py-3 text-left hover:bg-gradient-to-r hover:from-zinc-50 hover:to-slate-50 transition-all duration-200 group ${
                      selectedSuggestionIndex === index ? 'bg-gradient-to-r from-zinc-100 to-slate-100' : ''
                    }`}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                  >
                    <div className="text-[15px] text-slate-800 font-medium group-hover:text-zinc-900 transition-colors leading-snug">
                      {highlightMatch(product.name, localSearchQuery)}
                    </div>
                  </button>
                ))}
              </div>

              {/* View All Results */}
              <button
                type="button"
                onClick={() => {
                  change({ q: localSearchQuery }, { clearImageSearch: true });
                  setShowAutocompleteSuggestions(false);
                }}
                className="w-full px-5 py-3.5 text-sm font-semibold text-zinc-900 bg-gradient-to-r from-slate-50 to-zinc-50 hover:from-slate-100 hover:to-zinc-100 transition-all duration-200 border-t border-slate-200/80 flex items-center justify-center gap-2"
              >
                <SearchIcon className="w-4 h-4" />
                <span>View all results for "{localSearchQuery}"</span>
              </button>
            </div>
          )}
        </div>

        {/* Filters Grid - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Gender Filter */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">
              {t('gender')} / {t('category')}
            </label>
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
              className="w-full h-11 rounded-full border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22%3e%3cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 14l-7 7m0 0l-7-7m7 7V3%22%3e%3c/path%3e%3c/svg%3e')] bg-no-repeat bg-right bg-[length:16px] pr-8"
            >
              <option value="">{t('all')}</option>
              <option value="women">{t('women')}</option>
              <option value="men">{t('men')}</option>
              <option value="boys">{t('boys')}</option>
              <option value="girls">{t('girls')}</option>
              <option value="sale">{t('sale')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wide mb-2">
              {t('category')}
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                change({ category_id: e.target.value, parent_category: '' }, { clearImageSearch: true });
              }}
              className="w-full h-11 rounded-full border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22%3e%3cpath stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%222%22 d=%22M19 14l-7 7m0 0l-7-7m7 7V3%22%3e%3c/path%3e%3c/svg%3e')] bg-no-repeat bg-right bg-[length:16px] pr-8"
            >
              <option value="">{t('all')}</option>
              {categories && Array.isArray(categories) && categories.length > 0 ? (
                categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option disabled>{t('loadingCategories') || 'Loading...'}</option>
              )}
            </select>
          </div>

          {/* Wishlist Button */}
          <button
            onClick={() => change({ tab: tab === "wishlist" ? "" : "wishlist" })}
            className={`h-11 rounded-full border px-3 text-sm font-semibold transition-all ${
              tab === "wishlist" 
                ? "border-zinc-950 bg-zinc-950 text-white shadow-md" 
                : "border-zinc-300 bg-white hover:bg-zinc-50"
            }`}
          >
            {t('wishlist')}
          </button>

          {/* Cart Button */}
          <Link
            to="/cart"
            className="h-11 rounded-full border border-zinc-200 bg-white hover:bg-zinc-50 px-3 text-sm font-semibold flex items-center justify-center transition-all"
          >
            {t('cart')}
          </Link>
        </div>

        {/* Active Filters Display */}
        {(q || gender || categoryId || parentCategory) && (
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <div className="flex flex-wrap gap-2 items-center text-xs">
              <span className="text-zinc-600 font-medium">{t('activeFilters')}:</span>
              {q && (
                <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full flex items-center gap-2">
                  📝 {q}
                  <button onClick={() => change({ q: '' })} className="hover:text-red-600">×</button>
                </span>
              )}
              {gender && (
                <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full flex items-center gap-2">
                  👤 {gender.charAt(0).toUpperCase() + gender.slice(1)}
                  <button onClick={() => change({ gender: '' })} className="hover:text-red-600">×</button>
                </span>
              )}
              {categoryId && (
                <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full flex items-center gap-2">
                  📂 {categories.find(c => c.id === Number(categoryId))?.name || categoryId}
                  <button onClick={() => change({ category_id: '' })} className="hover:text-red-600">×</button>
                </span>
              )}
              {parentCategory && (
                <span className="bg-zinc-100 text-zinc-800 px-3 py-1 rounded-full flex items-center gap-2">
                  🧩 {parentCollectionLabel}
                  <button onClick={() => change({ parent_category: '' })} className="hover:text-red-600">×</button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Search Results Info */}
      {imageSearchResults && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl border border-purple-200 flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-xl overflow-hidden bg-white border border-purple-200 flex-shrink-0">
            <img
              src={imageSearchResults.image}
              alt={t('searchImageAlt')}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-purple-800 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4" />
              {t('searchingSimilarItems') || 'Searching Similar Items'}
            </p>
            <p className="text-sm text-purple-700">
              {products.length} {t('productsFoundMatchingImage') || 'products matching your image'}
            </p>
          </div>
          <button
            onClick={() => setShowImageSearch(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-colors flex-shrink-0"
          >
            {t('tryDifferent') || 'Try Different'}
          </button>
          <button
            onClick={clearImageSearch}
            className="px-4 py-2 bg-white text-purple-700 rounded-xl text-sm font-semibold border border-purple-300 hover:bg-purple-50 transition-colors flex-shrink-0"
          >
            {t('clear') || 'Clear'}
          </button>
        </div>
      )}

      {/* Products Container */}
      <div className="mt-6">
        {loading ? (
          /* Loading Skeleton */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, idx) => (
              <div key={idx} className="fs-card overflow-hidden">
                <div className="aspect-square bg-zinc-100 animate-pulse rounded-lg" />
                <div className="p-3 space-y-2">
                  <div className="h-3 w-2/3 bg-zinc-100 animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-zinc-100 animate-pulse rounded" />
                  <div className="h-8 w-20 bg-zinc-100 animate-pulse rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          /* Empty State */
          <div className="fs-card p-12 text-center">
            <div className="space-y-4">
              <div className="text-5xl">🔍</div>
              <p className="text-lg font-semibold text-zinc-900">{t('noProductsFound') || 'No Products Found'}</p>
              <p className="text-sm text-zinc-600">
                {imageSearchResults 
                  ? 'No products match this image. Try uploading a different image.'
                  : 'Try adjusting your search filters to find what you\'re looking for.'}
              </p>
              {!imageSearchResults && (
                <button
                  onClick={() => {
                    change({ q: '', gender: '', category_id: '', parent_category: '' });
                  }}
                  className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-full text-sm font-semibold hover:bg-zinc-800 transition-colors"
                >
                  {t('resetFilters') || 'Reset Filters'}
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Products Grid - Responsive 2→3→4→4→4→6 */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!imageSearchResults && meta && lastPage > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
          <button
            disabled={page <= 1}
            onClick={() => nav(`/search?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page - 1) }).toString()}`)}
            className="h-11 px-4 sm:px-6 rounded-full border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base font-semibold hover:bg-zinc-50 transition-colors"
          >
            ← {t('prev') || 'Prev'}
          </button>
          <div className="text-sm sm:text-base text-zinc-700 font-medium px-2">
            <span className="font-semibold text-zinc-900">{page}</span> / <span className="font-semibold text-zinc-900">{lastPage}</span>
          </div>
          <button
            disabled={page >= lastPage}
            onClick={() => nav(`/search?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page + 1) }).toString()}`)}
            className="h-11 px-4 sm:px-6 rounded-full border border-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed text-sm sm:text-base font-semibold hover:bg-zinc-50 transition-colors"
          >
            {t('next') || 'Next'} →
          </button>
        </div>
      )}
    </div>
  );
}

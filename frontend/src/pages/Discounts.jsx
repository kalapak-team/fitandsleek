import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import ProductCard from '../components/shop/ProductCard';
import { useLanguage } from '../lib/i18n.jsx';

export default function Discounts() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        const categoryData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setCategories(categoryData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  // Fetch discounted products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('per_page', 12);
        params.append('sort', sortBy);

        if (selectedCategory) params.append('category_id', selectedCategory);
        if (minPrice) params.append('min_price', minPrice);
        if (maxPrice) params.append('max_price', maxPrice);
        if (searchQuery) params.append('q', searchQuery);

        const res = await api.get(`/products/discounts?${params}`);
        const productData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setProducts(productData);
        setTotalPages(res.data?.last_page || 1);
      } catch (error) {
        console.error('Error fetching discounted products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, selectedCategory, sortBy, minPrice, maxPrice, searchQuery]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set('category', selectedCategory);
    if (sortBy && sortBy !== 'newest') params.set('sort', sortBy);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (searchQuery) params.set('q', searchQuery);
    
    setSearchParams(params);
    setPage(1);
  }, [selectedCategory, sortBy, minPrice, maxPrice, searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Search is already handled by useEffect watching searchQuery
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{t('discountsTitle')}</h1>
          <p className="text-indigo-100">{t('discountsSubtitle')}</p>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="col-span-1 sm:col-span-2 md:col-span-1">
              <input
                type="text"
                placeholder={t('searchDiscountsPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </form>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="">{t('allCategories')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="newest">{t('newest')}</option>
              <option value="price_low">{t('priceLowHigh')}</option>
              <option value="price_high">{t('priceHighLow')}</option>
              <option value="discount">{t('bestDiscount')}</option>
            </select>

            {/* Price Range */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={t('min')}
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
              />
              <input
                type="number"
                placeholder={t('max')}
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setSelectedCategory('');
                setSortBy('newest');
                setMinPrice('');
                setMaxPrice('');
                setSearchQuery('');
              }}
              className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-sm sm:text-base transition-colors"
            >
              {t('reset')}
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-xl h-96 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <div className="mb-4">
              <svg className="w-20 h-20 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">{t('noDiscountsFound')}</h3>
            <p className="text-slate-600 mb-6">{t('noDiscountsDesc')}</p>
            <button
              onClick={() => navigate('/shop')}
              className="inline-block px-6 sm:px-8 py-3 sm:py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-base sm:text-lg transition-colors"
            >
              {t('browseAllProducts')}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4 lg:gap-4 xl:gap-4 mb-8">
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  p={product}
                  showDiscount={true}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-sm sm:text-base hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('prev')}
                </button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base transition-colors ${
                        page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-white border border-slate-300 rounded-lg text-sm sm:text-base hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

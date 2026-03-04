import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function ExtendedHomepageManager() {
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Hero Banner
  const [heroBanner, setHeroBanner] = useState({
    message: '🚚 Free delivery on orders above $40',
    icon: '🚚',
    enabled: true,
  });

  // All Sections
  const [allSections, setAllSections] = useState({
    newIn: { title: 'NEW IN', icon: '📦', enabled: true, order: 1 },
    discounts: { title: '🎉 Discounts', icon: '🎉', enabled: true, order: 2 },
    women: { title: 'WOMEN', icon: '👗', enabled: true, order: 3 },
    men: { title: 'MEN', icon: '👔', enabled: true, order: 4 },
    boys: { title: 'BOYS', icon: '👦', enabled: true, order: 5 },
    clothes: { title: 'Clothes', icon: '👕', enabled: true, order: 6 },
    shoes: { title: 'Shoes', icon: '👠', enabled: true, order: 7 },
    belts: { title: 'Belts', icon: '⏱️', enabled: true, order: 8 },
    accessories: { title: 'Accessories', icon: '💍', enabled: true, order: 9 },
  });

  // Subsections for major categories
  const [subsections, setSubsections] = useState({
    newIn: [
      { name: 'New Arrivals', enabled: true },
      { name: 'Trending Now', enabled: true },
      { name: 'This Week', enabled: true },
    ],
    women: [
      { name: 'Tops', enabled: true },
      { name: 'Bottoms', enabled: true },
      { name: 'Dresses', enabled: true },
      { name: 'Outerwear', enabled: true },
      { name: 'Activewear', enabled: true },
      { name: 'Sneakers', enabled: true },
      { name: 'Slides', enabled: true },
      { name: 'Heels', enabled: true },
      { name: 'Boots', enabled: true },
      { name: 'Bags', enabled: true },
      { name: 'Belts', enabled: true },
      { name: 'Hats', enabled: true },
      { name: 'Jewelry', enabled: true },
    ],
    men: [
      { name: 'T-Shirts', enabled: true },
      { name: 'Shirts', enabled: true },
      { name: 'Hoodies', enabled: true },
      { name: 'Jeans', enabled: true },
      { name: 'Shorts', enabled: true },
      { name: 'Sneakers', enabled: true },
      { name: 'Running', enabled: true },
      { name: 'Slides', enabled: true },
      { name: 'Boots', enabled: true },
      { name: 'Bags', enabled: true },
      { name: 'Belts', enabled: true },
      { name: 'Caps & Hats', enabled: true },
      { name: 'Watches', enabled: true },
    ],
    boys: [
      { name: 'T-Shirts', enabled: true },
      { name: 'Shorts', enabled: true },
      { name: 'Shoes', enabled: true },
    ],
  });

  // Header & Footer (from previous manager)
  const [headerSettings, setHeaderSettings] = useState({
    logo_text: 'Fitandsleek',
    logo_url: '/logo.png',
    background_color: '#6F8F72',
    search_placeholder: 'Search items...',
    search_enabled: true,
    cart_enabled: true,
    wishlist_enabled: true,
    language_enabled: true,
    free_delivery_icon: '🚚',
    free_delivery_text: 'Free delivery on orders above $40',
    nav_visibility: {
      newIn: true,
      discounts: true,
      women: true,
      men: true,
      sale: true,
    },
    custom_nav: [],
    left_menu: [
      {
        title: 'Menu Visibility',
        items: [
          { label: 'NEW IN', to: '/search?tab=new', image: '/placeholder.svg' },
          { label: 'Discounts', to: '/discounts', image: '/placeholder.svg' },
          { label: 'Women', to: '/search?gender=women', image: '/placeholder.svg' },
          { label: 'Men', to: '/search?gender=men', image: '/placeholder.svg' },
          { label: 'Boys', to: '/search?gender=boys', image: '/placeholder.svg' },
          { label: 'Girls', to: '/search?gender=girls', image: '/placeholder.svg' },
          { label: 'Sale', to: '/search?tab=sale', image: '/placeholder.svg' },
        ],
      },
      {
        title: 'New Product',
        items: [
          { label: 'New Arrivals', to: '/search?tab=new', image: '/placeholder.svg' },
          { label: 'Trending Now', to: '/search?tab=trending', image: '/placeholder.svg' },
          { label: 'This Week', to: '/search?tab=this-week', image: '/placeholder.svg' },
          { label: 'Best Sellers', to: '/search?q=Best%20Seller', image: '/placeholder.svg' },
          { label: 'Editor Picks', to: '/search?q=Editors%20Pick', image: '/placeholder.svg' },
          { label: 'Limited Drop', to: '/search?q=Limited%20Drop', image: '/placeholder.svg' },
          { label: 'Fresh Styles', to: '/search?q=Fresh%20Style', image: '/placeholder.svg' },
          { label: 'Just Added', to: '/search?q=Just%20Added', image: '/placeholder.svg' },
        ],
      },
      {
        title: 'Product Trending',
        items: [
          { label: 'Trending Now', to: '/search?tab=trending', image: '/placeholder.svg' },
          { label: 'Top Rated', to: '/search?sort=rating', image: '/placeholder.svg' },
          { label: 'Best Sellers', to: '/search?sort=popular', image: '/placeholder.svg' },
          { label: 'Most Viewed', to: '/search?q=Most%20Viewed', image: '/placeholder.svg' },
          { label: 'Popular Now', to: '/search?q=Popular%20Now', image: '/placeholder.svg' },
          { label: 'Street Style', to: '/search?q=Street%20Style', image: '/placeholder.svg' },
          { label: 'Viral Picks', to: '/search?q=Viral', image: '/placeholder.svg' },
          { label: 'Trending This Week', to: '/search?q=Trending%20This%20Week', image: '/placeholder.svg' },
        ],
      },
      {
        title: 'Product Discounts',
        items: [
          { label: 'All Discounts', to: '/discounts', image: '/placeholder.svg' },
          { label: 'Clothes', to: '/discounts/clothes', image: '/placeholder.svg' },
          { label: 'Shoes', to: '/discounts/shoes', image: '/placeholder.svg' },
          { label: 'Under $20', to: '/discounts?max_price=20', image: '/placeholder.svg' },
          { label: 'Top Deals', to: '/discounts?sort=discount', image: '/placeholder.svg' },
          { label: 'Accessories', to: '/discounts?q=Accessories', image: '/placeholder.svg' },
          { label: 'Bags', to: '/discounts?q=Bags', image: '/placeholder.svg' },
          { label: 'Flash Sale', to: '/discounts?q=Flash', image: '/placeholder.svg' },
        ],
      },
      {
        title: 'Brands & Categories',
        items: [
          { label: 'Brand Logos', to: '/search', image: '/placeholder.svg' },
          { label: 'Categories', to: '/search', image: '/placeholder.svg' },
          { label: 'Nike', to: '/search?q=Nike', image: '/placeholder.svg' },
          { label: 'Adidas', to: '/search?q=Adidas', image: '/placeholder.svg' },
          { label: 'Puma', to: '/search?q=Puma', image: '/placeholder.svg' },
          { label: 'Zara', to: '/search?q=Zara', image: '/placeholder.svg' },
          { label: 'Clothes', to: '/search?q=Clothes', image: '/placeholder.svg' },
          { label: 'Accessories', to: '/search?q=Accessories', image: '/placeholder.svg' },
        ],
      },
    ],
    nav_labels: {},
  });

  const [footerSettings, setFooterSettings] = useState({
    company_name: 'Fitandsleek',
    company_description: 'Modern fashion store for slick everyday outfits and streetwear.',
    contact_title: 'CONTACT',
    contact_email: 'kalapakgpt@gmail.com',
    contact_phone: '+855 00 00 000',
    contact_address: 'Phnom Penh, Cambodia',
    copyright_text: '© 2026 Fitandsleek. All rights reserved.',
    background_color: '#6F8F72',
    social_title: 'FOLLOW US',
    social_enabled: true,
    support_enabled: true,
    tracking_enabled: true,
    privacy_enabled: true,
    contact_enabled: true,
  });

  const [footerSectionTitles, setFooterSectionTitles] = useState({
    support: 'HELP',
    tracking: 'TRACKING',
    legal: 'LEGAL',
  });

  const [footerSocials, setFooterSocials] = useState([
    { platform: 'facebook', url: '#' },
    { platform: 'instagram', url: '#' },
    { platform: 'twitter', url: '#' },
  ]);

  const [footerSections, setFooterSections] = useState({
    support: {
      title: 'HELP',
      items: [
        { label: 'Help Center', link: '/support' },
        { label: 'FAQ', link: '/faq' },
        { label: 'Contact Us', link: '/contact' },
      ],
    },
    tracking: {
      title: 'TRACKING',
      items: [
        { label: 'Track Order', link: '/track-order' },
        { label: 'Returns', link: '/returns' },
        { label: 'Shipping Info', link: '/shipping' },
      ],
    },
    legal: {
      title: 'LEGAL',
      items: [
        { label: 'Privacy Policy', link: '/privacy' },
        { label: 'Terms & Conditions', link: '/terms' },
        { label: 'Cookies Policy', link: '/cookies' },
      ],
    },
  });

  const headerLinkOptions = [
    { label: 'New In', value: '/search?tab=new' },
    { label: 'Discounts', value: '/discounts' },
    { label: 'Women', value: '/search?gender=women' },
    { label: 'Men', value: '/search?gender=men' },
    { label: 'Sale', value: '/search?tab=sale' },
    { label: 'All Products', value: '/search' },
    { label: 'Cart', value: '/cart' },
    { label: 'Contact', value: '/contact' },
    { label: 'Support', value: '/support' },
    { label: 'Track Order', value: '/track-order' },
    { label: 'Privacy', value: '/privacy' },
  ];

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await api.get('/homepage-settings');
        const data = response.data;

        // Update hero
        if (data.hero) setHeroBanner(data.hero);
        
        // Update sections
        if (data.sections) setAllSections(data.sections);
        if (data.subsections) setSubsections(data.subsections);
        
        // Update header
        if (data.header) setHeaderSettings(data.header);
        
        // Update footer
        if (data.footer) setFooterSettings(data.footer);
        if (data.footer_sections) {
          setFooterSections(data.footer_sections);
          if (!data.footer_section_titles) {
            setFooterSectionTitles({
              support: data.footer_sections.support?.title || 'HELP',
              tracking: data.footer_sections.tracking?.title || 'TRACKING',
              legal: data.footer_sections.legal?.title || 'LEGAL',
            });
          }
        }
        if (data.footer_section_titles) setFooterSectionTitles(data.footer_section_titles);
        if (data.footer_socials) setFooterSocials(data.footer_socials);
      } catch (err) {
        console.log('Note: Could not load settings from API. Using defaults.', err.message);
      }
    };
    loadSettings();
  }, []);

  // Handle section toggle
  const toggleSection = (sectionKey) => {
    setAllSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        enabled: !prev[sectionKey].enabled
      }
    }));
  };

  // Handle subsection toggle
  const toggleSubsection = (parentKey, index) => {
    setSubsections(prev => {
      const updated = { ...prev };
      if (updated[parentKey]) {
        const newSubs = [...updated[parentKey]];
        newSubs[index] = { ...newSubs[index], enabled: !newSubs[index].enabled };
        updated[parentKey] = newSubs;
      }
      return updated;
    });
  };

  // Save functions
  const saveHero = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/hero', heroBanner);
      setSuccess('✅ Hero banner saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('⚠️ Please login first to save changes');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveSections = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/sections-extended', { 
        sections: allSections,
        subsections 
      });
      setSuccess('✅ All sections saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('⚠️ Please login first to save changes');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveHeader = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/header-extended', headerSettings);
      setSuccess('✅ Header saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('⚠️ Please login first to save changes');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveFooter = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/footer-extended', { 
        footer: footerSettings,
        footer_sections: footerSections,
        footer_section_titles: footerSectionTitles,
        footer_socials: footerSocials
      });
      setSuccess('✅ Footer saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('⚠️ Please login first to save changes');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🏪 Complete Homepage Manager</h1>
          <p className="text-gray-600 text-lg">Manage all homepage sections, hero banner, header, and footer</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-sm font-semibold hover:underline">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-300 overflow-x-auto pb-2">
          {[
            { id: 'hero', label: '🚚 Hero Banner', icon: '🚚' },
            { id: 'sections', label: '📦 All Sections', icon: '📦' },
            { id: 'header', label: '🔝 Header', icon: '🔝' },
            { id: 'footer', label: '🔚 Footer', icon: '🔚' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hero Banner Tab */}
        {activeTab === 'hero' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Hero Banner Settings</h2>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Banner Icon</label>
                <input
                  type="text"
                  value={heroBanner.icon}
                  onChange={(e) => setHeroBanner({ ...heroBanner, icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="🚚"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Banner Message</label>
                <textarea
                  value={heroBanner.message}
                  onChange={(e) => setHeroBanner({ ...heroBanner, message: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={heroBanner.enabled}
                  onChange={(e) => setHeroBanner({ ...heroBanner, enabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="font-medium text-gray-900">Show Hero Banner</span>
              </label>
            </div>
            <button
              onClick={saveHero}
              disabled={loading}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? '💾 Saving...' : '💾 Save Hero Banner'}
            </button>
          </div>
        )}

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Homepage Sections</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {Object.entries(allSections).map(([key, section]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">{key}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => toggleSection(key)}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                  </div>
                  
                  {/* Order input */}
                  <div className="flex items-center gap-2 mt-3">
                    <label className="text-sm font-medium text-gray-700">Order:</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      defaultValue={section.order}
                      onChange={(e) => {
                        const newSections = { ...allSections };
                        newSections[key].order = parseInt(e.target.value);
                        setAllSections(newSections);
                      }}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                    />
                  </div>

                  {/* Subsections if available */}
                  {subsections[key] && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">Subsections:</p>
                      <div className="space-y-2">
                        {subsections[key].map((sub, idx) => (
                          <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sub.enabled}
                              onChange={() => toggleSubsection(key, idx)}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="text-gray-700">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.enabled ? (
                    <div className="mt-3 text-xs text-green-600 font-semibold">✓ Enabled</div>
                  ) : (
                    <div className="mt-3 text-xs text-gray-500">⊘ Disabled</div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveSections}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? '💾 Saving...' : '💾 Save All Sections'}
            </button>
          </div>
        )}

        {/* Header Tab */}
        {activeTab === 'header' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Header Settings</h2>
            <div className="space-y-6 max-w-2xl mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Search Placeholder</label>
                <input
                  type="text"
                  value={headerSettings.search_placeholder}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, search_placeholder: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Logo Image URL</label>
                <input
                  type="text"
                  value={headerSettings.logo_url || ''}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, logo_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Header Background Color</label>
                <input
                  type="color"
                  value={headerSettings.background_color || '#6F8F72'}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, background_color: e.target.value })}
                  className="w-20 h-10 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Upload Logo Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('logo', file);
                    try {
                      setLoading(true);
                      const { data } = await api.post('/admin/homepage-settings/logo-upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      });
                      if (data?.logo_url) {
                        setHeaderSettings({ ...headerSettings, logo_url: data.logo_url });
                      }
                      setSuccess('✅ Logo uploaded!');
                      setTimeout(() => setSuccess(''), 3000);
                    } catch (err) {
                      setError('Failed to upload logo: ' + (err.response?.data?.message || err.message));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Free Delivery Icon</label>
                <input
                  type="text"
                  value={headerSettings.free_delivery_icon || '🚚'}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, free_delivery_icon: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Free Delivery Message</label>
                <input
                  type="text"
                  value={headerSettings.free_delivery_text}
                  onChange={(e) => setHeaderSettings({ ...headerSettings, free_delivery_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Features</h3>
                {['search_enabled', 'cart_enabled', 'wishlist_enabled', 'language_enabled'].map(feature => (
                  <label key={feature} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerSettings[feature]}
                      onChange={(e) => setHeaderSettings({ ...headerSettings, [feature]: e.target.checked })}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="font-medium text-gray-900">{feature.replace(/_/g, ' ').toUpperCase()}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Menu Visibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'newIn', label: 'NEW IN' },
                  { key: 'discounts', label: 'Discounts' },
                  { key: 'women', label: 'Women' },
                  { key: 'men', label: 'Men' },
                  { key: 'sale', label: 'Sale' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <input
                      type="checkbox"
                      checked={headerSettings.nav_visibility?.[item.key] !== false}
                      onChange={(e) => setHeaderSettings({
                        ...headerSettings,
                        nav_visibility: {
                          ...(headerSettings.nav_visibility || {}),
                          [item.key]: e.target.checked,
                        }
                      })}
                      className="rounded border-gray-300"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Custom Menu Items</h3>
              <div className="space-y-3">
                {(headerSettings.custom_nav || []).map((item, idx) => (
                  <div key={`${item.label}-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <input
                      type="text"
                      placeholder="Label"
                      value={item.label || ''}
                      onChange={(e) => {
                        const next = [...(headerSettings.custom_nav || [])];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setHeaderSettings({ ...headerSettings, custom_nav: next });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={item.to || ''}
                      onChange={(e) => {
                        const next = [...(headerSettings.custom_nav || [])];
                        next[idx] = { ...next[idx], to: e.target.value };
                        setHeaderSettings({ ...headerSettings, custom_nav: next });
                      }}
                      className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a page</option>
                      {headerLinkOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        const next = (headerSettings.custom_nav || []).filter((_, i) => i !== idx);
                        setHeaderSettings({ ...headerSettings, custom_nav: next });
                      }}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setHeaderSettings({
                    ...headerSettings,
                    custom_nav: [...(headerSettings.custom_nav || []), { label: '', to: '' }],
                  })}
                  className="px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 font-medium"
                >
                  + Add Menu Item
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Left Hover Menu</h3>
              <div className="space-y-4">
                {(headerSettings.left_menu || []).map((section, sIdx) => (
                  <div key={sIdx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => {
                          const next = [...(headerSettings.left_menu || [])];
                          next[sIdx] = { ...next[sIdx], title: e.target.value };
                          setHeaderSettings({ ...headerSettings, left_menu: next });
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                        placeholder="Section title"
                      />
                      <button
                        onClick={() => {
                          const next = (headerSettings.left_menu || []).filter((_, i) => i !== sIdx);
                          setHeaderSettings({ ...headerSettings, left_menu: next });
                        }}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove Section
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(section.items || []).map((item, iIdx) => (
                        <div key={iIdx} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Label"
                            value={item.label || ''}
                            onChange={(e) => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = [...(next[sIdx].items || [])];
                              items[iIdx] = { ...items[iIdx], label: e.target.value };
                              next[sIdx] = { ...next[sIdx], items };
                              setHeaderSettings({ ...headerSettings, left_menu: next });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          <select
                            value={item.to || ''}
                            onChange={(e) => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = [...(next[sIdx].items || [])];
                              items[iIdx] = { ...items[iIdx], to: e.target.value };
                              next[sIdx] = { ...next[sIdx], items };
                              setHeaderSettings({ ...headerSettings, left_menu: next });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select a page</option>
                            {headerLinkOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={item.image || ''}
                            onChange={(e) => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = [...(next[sIdx].items || [])];
                              items[iIdx] = { ...items[iIdx], image: e.target.value };
                              next[sIdx] = { ...next[sIdx], items };
                              setHeaderSettings({ ...headerSettings, left_menu: next });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = (next[sIdx].items || []).filter((_, i) => i !== iIdx);
                              next[sIdx] = { ...next[sIdx], items };
                              setHeaderSettings({ ...headerSettings, left_menu: next });
                            }}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const next = [...(headerSettings.left_menu || [])];
                          const items = [...(next[sIdx].items || []), { label: '', to: '', image: '' }];
                          next[sIdx] = { ...next[sIdx], items };
                          setHeaderSettings({ ...headerSettings, left_menu: next });
                        }}
                        className="px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 font-medium"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setHeaderSettings({
                    ...headerSettings,
                    left_menu: [...(headerSettings.left_menu || []), { title: '', items: [] }],
                  })}
                  className="px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 font-medium"
                >
                  + Add Section
                </button>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Menu Labels</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'newIn', label: 'NEW IN' },
                  { key: 'newArrivals', label: 'New Arrivals' },
                  { key: 'trendingNow', label: 'Trending Now' },
                  { key: 'thisWeek', label: 'This Week' },
                  { key: 'discounts', label: 'Discounts' },
                  { key: 'allDiscounts', label: 'All Discounts' },
                  { key: 'clothes', label: 'Clothes' },
                  { key: 'shoes', label: 'Shoes' },
                  { key: 'bags', label: 'Bags' },
                  { key: 'belts', label: 'Belts' },
                  { key: 'accessories', label: 'Accessories' },
                  { key: 'women', label: 'Women' },
                  { key: 'tops', label: 'Tops' },
                  { key: 'bottoms', label: 'Bottoms' },
                  { key: 'dresses', label: 'Dresses' },
                  { key: 'outerwear', label: 'Outerwear' },
                  { key: 'activewear', label: 'Activewear' },
                  { key: 'sneakers', label: 'Sneakers' },
                  { key: 'slides', label: 'Slides' },
                  { key: 'heels', label: 'Heels' },
                  { key: 'boots', label: 'Boots' },
                  { key: 'hats', label: 'Hats' },
                  { key: 'jewelry', label: 'Jewelry' },
                  { key: 'girls', label: 'Girls' },
                  { key: 'freshDrops', label: 'Fresh drops for everyday fits' },
                  { key: 'viewAll', label: 'View All' },
                  { key: 'men', label: 'Men' },
                  { key: 'tShirts', label: 'T-Shirts' },
                  { key: 'shirts', label: 'Shirts' },
                  { key: 'hoodies', label: 'Hoodies' },
                  { key: 'jeans', label: 'Jeans' },
                  { key: 'shorts', label: 'Shorts' },
                  { key: 'running', label: 'Running' },
                  { key: 'capsHats', label: 'Caps & Hats' },
                  { key: 'watches', label: 'Watches' },
                  { key: 'boys', label: 'Boys' },
                  { key: 'grabDeals', label: 'Grab deals before they\'re gone' },
                  { key: 'sale', label: 'SALE' },
                  { key: 'allSaleItems', label: 'All Sale Items' },
                  { key: 'womensSale', label: 'Women\'s Sale' },
                  { key: 'mensSale', label: 'Men\'s Sale' },
                ].map((item) => (
                  <div key={item.key}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{item.label}</label>
                    <input
                      type="text"
                      value={headerSettings.nav_labels?.[item.key] || ''}
                      onChange={(e) => setHeaderSettings({
                        ...headerSettings,
                        nav_labels: {
                          ...(headerSettings.nav_labels || {}),
                          [item.key]: e.target.value,
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={saveHeader}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? '💾 Saving...' : '💾 Save Header'}
            </button>
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === 'footer' && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold mb-6">Footer Settings</h2>
            
            <div className="space-y-6 mb-8 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Company Name</label>
                <input
                  type="text"
                  value={footerSettings.company_name}
                  onChange={(e) => setFooterSettings({ ...footerSettings, company_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                <textarea
                  value={footerSettings.company_description}
                  onChange={(e) => setFooterSettings({ ...footerSettings, company_description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Contact Section Title</label>
                <input
                  type="text"
                  value={footerSettings.contact_title || 'CONTACT'}
                  onChange={(e) => setFooterSettings({ ...footerSettings, contact_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., CONTACT, GET IN TOUCH, SUPPORT"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                <input
                  type="email"
                  value={footerSettings.contact_email}
                  onChange={(e) => setFooterSettings({ ...footerSettings, contact_email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                <input
                  type="tel"
                  value={footerSettings.contact_phone}
                  onChange={(e) => setFooterSettings({ ...footerSettings, contact_phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Address</label>
                <input
                  type="text"
                  value={footerSettings.contact_address}
                  onChange={(e) => setFooterSettings({ ...footerSettings, contact_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Copyright</label>
                <input
                  type="text"
                  value={footerSettings.copyright_text}
                  onChange={(e) => setFooterSettings({ ...footerSettings, copyright_text: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Footer Background Color</label>
                <input
                  type="color"
                  value={footerSettings.background_color || '#6F8F72'}
                  onChange={(e) => setFooterSettings({ ...footerSettings, background_color: e.target.value })}
                  className="w-20 h-10 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Social Title</label>
                <input
                  type="text"
                  value={footerSettings.social_title || 'FOLLOW US'}
                  onChange={(e) => setFooterSettings({ ...footerSettings, social_title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <input
                  type="checkbox"
                  checked={footerSettings.social_enabled}
                  onChange={(e) => setFooterSettings({ ...footerSettings, social_enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                Show Social Icons
              </label>
            </div>

            <h3 className="text-xl font-bold mb-4">Social Links</h3>
            <div className="space-y-4 mb-8">
              {footerSocials.map((item, idx) => (
                <div key={`${item.platform}-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                  <select
                    value={item.platform}
                    onChange={(e) => {
                      const next = [...footerSocials];
                      next[idx] = { ...next[idx], platform: e.target.value };
                      setFooterSocials(next);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="telegram">Telegram</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="website">Website</option>
                  </select>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={item.url}
                    onChange={(e) => {
                      const next = [...footerSocials];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setFooterSocials(next);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => setFooterSocials(footerSocials.filter((_, i) => i !== idx))}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={() => setFooterSocials([...footerSocials, { platform: 'facebook', url: '' }])}
                className="px-4 py-2 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 font-medium"
              >
                + Add Social Link
              </button>
            </div>

            <h3 className="text-xl font-bold mb-4">Footer Section Titles</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Support Section Title</label>
                <input
                  type="text"
                  value={footerSectionTitles.support || 'HELP'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFooterSectionTitles({ ...footerSectionTitles, support: value });
                    setFooterSections({
                      ...footerSections,
                      support: { ...footerSections.support, title: value },
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., HELP, SUPPORT, CUSTOMER SERVICE"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Tracking Section Title</label>
                <input
                  type="text"
                  value={footerSectionTitles.tracking || 'TRACKING'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFooterSectionTitles({ ...footerSectionTitles, tracking: value });
                    setFooterSections({
                      ...footerSections,
                      tracking: { ...footerSections.tracking, title: value },
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., TRACKING, SHIPPING, ORDERS"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Legal Section Title</label>
                <input
                  type="text"
                  value={footerSectionTitles.legal || 'LEGAL'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFooterSectionTitles({ ...footerSectionTitles, legal: value });
                    setFooterSections({
                      ...footerSections,
                      legal: { ...footerSections.legal, title: value },
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., LEGAL, POLICIES, COMPLIANCE"
                />
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Footer Links</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {Object.entries(footerSections).map(([sectionKey, section]) => (
                <div key={sectionKey} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">{section.title}</h4>
                  <div className="space-y-2">
                    {section.items && section.items.map((link, idx) => (
                      <div key={idx} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                        📌 {link.label}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveFooter}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition"
            >
              {loading ? '💾 Saving...' : '💾 Save Footer'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

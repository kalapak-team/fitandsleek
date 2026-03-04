import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { resolveImageUrl } from '../../lib/images';
import { AdminContentSkeleton } from '@/components/admin/AdminLoading';
import { useTheme } from '../../state/theme.jsx';

const defaultLeftMenu = [
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
];

export default function CompleteHomepageManager() {
  const { mode } = useTheme();
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sections data
  const [sections, setSections] = useState({
    discounts: { title: 'Discounts', enabled: true, order: 1 },
    clothes: { title: 'Clothes', enabled: true, order: 2 },
    shoes: { title: 'Shoes', enabled: true, order: 3 },
    belts: { title: 'Belts', enabled: true, order: 4 },
  });
  const [newSection, setNewSection] = useState({
    key: '',
    title: '',
    order: 5,
    enabled: true,
  });

  // Header data
  const [headerSettings, setHeaderSettings] = useState({
    logo_text: 'FIT&SLEEK',
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
    left_menu: defaultLeftMenu,
    nav_labels: {},
  });

  // Footer data
  const [footerSettings, setFooterSettings] = useState({
    company_name: 'FIT&SLEEK Pro',
    company_description: 'Your fashion destination',
    contact_title: 'CONTACT',
    contact_email: 'kalapakgpt@gmail.com',
    contact_phone: '+855 00 00 000',
    contact_address: 'Phnom Penh, Cambodia',
    social_title: 'FOLLOW US',
    social_enabled: true,
    support_enabled: true,
    tracking_enabled: true,
    privacy_enabled: true,
    contact_enabled: true,
    copyright_text: '© 2026 FIT&SLEEK Pro. All rights reserved.',
    background_color: '#6F8F72',
  });

  // Footer links sections
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

  const [footerSocials, setFooterSocials] = useState([
    { platform: 'facebook', url: '#' },
    { platform: 'instagram', url: '#' },
    { platform: 'twitter', url: '#' },
  ]);

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

  const footerLinkOptions = [
    { label: 'Support', value: '/support' },
    { label: 'FAQ', value: '/faq' },
    { label: 'Contact', value: '/contact' },
    { label: 'Track Order', value: '/track-order' },
    { label: 'Returns', value: '/returns' },
    { label: 'Shipping Info', value: '/shipping' },
    { label: 'Privacy Policy', value: '/privacy' },
    { label: 'Terms & Conditions', value: '/terms' },
    { label: 'Cookies Policy', value: '/cookies' },
    { label: 'All Products', value: '/search' },
    { label: 'Women', value: '/search?gender=women' },
    { label: 'Men', value: '/search?gender=men' },
    { label: 'Cart', value: '/cart' },
  ];

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        // Try loading from API (uses public endpoint by default)
        const response = await api.get('/homepage-settings');

        if (response.data) {
          setSections(response.data.sections || sections);
          setHeaderSettings(response.data.header || headerSettings);
          setFooterSettings(response.data.footer || footerSettings);
          if (response.data.footer_socials) {
            setFooterSocials(response.data.footer_socials);
          }
          if (response.data.footer_sections) {
            const incoming = response.data.footer_sections;
            const isOldSupportList = Array.isArray(incoming.support);
            const isOldTrackingList = Array.isArray(incoming.tracking);
            const isOldLegalList = Array.isArray(incoming.legal);

            if (isOldSupportList || isOldTrackingList || isOldLegalList) {
              setFooterSections({
                support: { title: 'HELP', items: incoming.support || [] },
                tracking: { title: 'TRACKING', items: incoming.tracking || [] },
                legal: { title: 'LEGAL', items: incoming.legal || [] },
              });
            } else {
              setFooterSections(incoming);
            }
          }
          setSuccess('Settings loaded successfully');
        }
      } catch (err) {
        console.warn('Using default settings (API not available):', err.message);
        setSuccess('Using default settings');
      } finally {
        setLoading(false);
        setInitialLoading(false);
        setTimeout(() => setSuccess(''), 3000);
      }
    };

    loadSettings();
  }, []);

  const handleSectionToggle = (sectionKey) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        enabled: !prev[sectionKey].enabled
      }
    }));
  };

  const handleSectionOrderChange = (sectionKey, newOrder) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        order: parseInt(newOrder, 10) || 1
      }
    }));
  };

  const handleSectionTitleChange = (sectionKey, newTitle) => {
    setSections(prev => ({
      ...prev,
      [sectionKey]: {
        ...prev[sectionKey],
        title: newTitle,
      }
    }));
  };

  const normalizeSectionKey = (value) => {
    return String(value || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const handleAddSection = () => {
    const normalizedKey = normalizeSectionKey(newSection.key || newSection.title);
    const title = String(newSection.title || '').trim();
    const order = parseInt(newSection.order, 10) || Object.keys(sections).length + 1;

    if (!normalizedKey) {
      setError('Section key is required.');
      return;
    }

    if (!title) {
      setError('Section title is required.');
      return;
    }

    if (sections[normalizedKey]) {
      setError('Section key already exists. Please use a different key.');
      return;
    }

    setSections(prev => ({
      ...prev,
      [normalizedKey]: {
        title,
        enabled: !!newSection.enabled,
        order,
      },
    }));

    setNewSection({
      key: '',
      title: '',
      order: order + 1,
      enabled: true,
    });
    setError('');
  };

  const handleRemoveSection = (sectionKey) => {
    setSections(prev => {
      const next = { ...prev };
      delete next[sectionKey];
      return next;
    });
  };

  const handleHeaderChange = (key, value) => {
    setHeaderSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const uploadLeftMenuImage = async (sectionIndex, itemIndex, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      setLoading(true);
      const { data } = await api.post('/admin/homepage-settings/menu-image-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data?.image_url) {
        const next = [...(headerSettings.left_menu || [])];
        const items = [...(next[sectionIndex]?.items || [])];
        items[itemIndex] = { ...items[itemIndex], image: data.image_url };
        next[sectionIndex] = { ...next[sectionIndex], items };
        handleHeaderChange('left_menu', next);
      }
      setSuccess('✅ Image uploaded!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload image: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const isDark = mode === 'dark';

  const deleteButtonStyle = {
    backgroundColor: isDark ? 'rgba(127, 29, 29, 0.22)' : '#fef2f2',
    color: isDark ? '#fecdd3' : '#991b1b',
    border: `1px solid ${isDark ? 'rgba(248, 113, 113, 0.45)' : '#fecdd3'}`,
    borderRadius: '0.75rem',
    height: '2.5rem',
    width: '2.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease',
  };

  const handleFooterChange = (key, value) => {
    setFooterSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFooterLinkChange = (section, index, field, value) => {
    setFooterSections(prev => {
      const items = [...(prev[section]?.items || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [section]: { ...prev[section], items } };
    });
  };

  const handleAddFooterLink = (section) => {
    setFooterSections(prev => ({
      ...prev,
      [section]: { ...prev[section], items: [...(prev[section]?.items || []), { label: '', link: '' }] }
    }));
  };

  const handleRemoveFooterLink = (section, index) => {
    setFooterSections(prev => ({
      ...prev,
      [section]: { ...prev[section], items: (prev[section]?.items || []).filter((_, i) => i !== index) }
    }));
  };

  const saveSections = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/sections', { sections });
      setSuccess('✅ Section settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ You need to be logged in as an admin to save. Please login first.');
      } else {
        setError('Failed to save sections: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveHeaderSettings = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/header-extended', headerSettings);
      setSuccess('Header settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save header settings: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const saveFooterSettings = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/footer-extended', {
        footer: footerSettings,
        footer_sections: footerSections,
        footer_socials: footerSocials,
      });
      setSuccess('✅ Footer settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ You need to be logged in as an admin to save. Please login first.');
      } else {
        setError('Failed to save footer settings: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) return <AdminContentSkeleton title="Homepage Manager" />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Homepage Manager</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all homepage content including header, sections, and footer</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/40 p-4 text-red-700 dark:text-red-100">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-sm font-semibold hover:underline">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-green-700/60 bg-black dark:bg-green-700 p-4 text-white">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'sections'
                ? 'bg-black text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70'
              }`}
          >
            📄 Page Sections
          </button>
          <button
            onClick={() => setActiveTab('header')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'header'
                ? 'bg-black text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70'
              }`}
          >
            🔝 Header Settings
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'footer'
                ? 'bg-black text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70'
              }`}
          >
            🔚 Footer Settings
          </button>
        </div>

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Homepage Sections</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Manage sections displayed on the homepage. Enable/disable sections and set their display order.</p>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Add New Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <input
                  type="text"
                  value={newSection.title}
                  onChange={(e) => setNewSection(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Section title (e.g. Accessories)"
                  className="md:col-span-2 h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={newSection.key}
                  onChange={(e) => setNewSection(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="Section key (optional)"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="number"
                  min="1"
                  value={newSection.order}
                  onChange={(e) => setNewSection(prev => ({ ...prev, order: e.target.value }))}
                  placeholder="Order"
                  className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="h-11 rounded-lg bg-black px-4 text-sm font-semibold text-white"
                >
                  Add Section
                </button>
              </div>
              <label className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={newSection.enabled}
                  onChange={(e) => setNewSection(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="text-blue-600 border-slate-300 dark:border-slate-600"
                />
                Enabled by default
              </label>
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Section List</h3>
              <div className="space-y-4">
              {Object.entries(sections)
                .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
                .map(([key, section]) => (
                  <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={() => handleSectionToggle(key)}
                        className="h-5 w-5 cursor-pointer rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />

                      {/* Section name */}
                      <div className="flex-1">
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) => handleSectionTitleChange(key, e.target.value)}
                          className="w-full max-w-sm h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-base font-semibold text-slate-900 dark:text-slate-100 focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900"
                        />
                        <p className="text-sm text-slate-500 dark:text-slate-400">{key}</p>
                      </div>

                      {/* Order input */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-700">Display Order:</label>
                        <input
                          type="number"
                          value={section.order}
                          onChange={(e) => handleSectionOrderChange(key, e.target.value)}
                          min="1"
                          max="99"
                          className="h-11 w-20 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-center text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveSection(key)}
                        title="Remove"
                        className="transition-colors"
                        style={deleteButtonStyle}
                        aria-label="Remove section"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                        </svg>
                      </button>
                    </div>
                    {section.enabled ? (
                      <div className="mt-2 inline-flex items-center rounded-full border border-black bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-black dark:text-white">Enabled</div>
                    ) : (
                      <div className="mt-2 inline-flex items-center rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Disabled</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveSections}
                disabled={loading}
                className="h-11 rounded-lg bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save Section Settings
              </button>
            </div>
          </div>
        )}

        {/* Header Tab */}
        {activeTab === 'header' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Header Settings</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Configure header elements and features</p>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Basic Header Setup</h3>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Search Placeholder</label>
                <input
                  type="text"
                  value={headerSettings.search_placeholder || ''}
                  onChange={(e) => handleHeaderChange('search_placeholder', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Logo Image URL</label>
                <input
                  type="text"
                  value={headerSettings.logo_url || ''}
                  onChange={(e) => handleHeaderChange('logo_url', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Header Background Color</label>
                <input
                  type="color"
                  value={headerSettings.background_color || '#6F8F72'}
                  onChange={(e) => handleHeaderChange('background_color', e.target.value)}
                  className="h-10 w-20 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Upload Logo Image</label>
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
                        handleHeaderChange('logo_url', data.logo_url);
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
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Free Delivery Icon</label>
                <input
                  type="text"
                  value={headerSettings.free_delivery_icon || '🚚'}
                  onChange={(e) => handleHeaderChange('free_delivery_icon', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Free Delivery Message</label>
                <input
                  type="text"
                  value={headerSettings.free_delivery_text || ''}
                  onChange={(e) => handleHeaderChange('free_delivery_text', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 dark:text-white">Enabled Features</h3>
                {['search_enabled', 'cart_enabled', 'wishlist_enabled', 'language_enabled'].map(feature => (
                  <label key={feature} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/70 bg-white dark:bg-slate-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerSettings[feature]}
                      onChange={(e) => handleHeaderChange(feature, e.target.checked)}
                      className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {feature.replace(/_/g, ' ').replace('enabled', '').toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Menu Visibility</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { key: 'newIn', label: 'NEW IN' },
                  { key: 'discounts', label: 'Discounts' },
                  { key: 'women', label: 'Women' },
                  { key: 'men', label: 'Men' },
                  { key: 'sale', label: 'Sale' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                    <input
                      type="checkbox"
                      checked={headerSettings.nav_visibility?.[item.key] !== false}
                      onChange={(e) => handleHeaderChange('nav_visibility', {
                        ...(headerSettings.nav_visibility || {}),
                        [item.key]: e.target.checked,
                      })}
                      className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Custom Menu Items</h3>
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
                        handleHeaderChange('custom_nav', next);
                      }}
                      className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <select
                      value={item.to || ''}
                      onChange={(e) => {
                        const next = [...(headerSettings.custom_nav || [])];
                        next[idx] = { ...next[idx], to: e.target.value };
                        handleHeaderChange('custom_nav', next);
                      }}
                      className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
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
                        handleHeaderChange('custom_nav', next);
                      }}
                      title="Remove"
                      className="transition-colors"
                      style={deleteButtonStyle}
                      aria-label="Remove navigation item"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleHeaderChange('custom_nav', [...(headerSettings.custom_nav || []), { label: '', to: '' }])}
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  + Add Menu Item
                </button>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Left Hover Menu</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  onClick={() => handleHeaderChange('left_menu', defaultLeftMenu)}
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Create Left Hover Menu
                </button>
              </div>
              <div className="space-y-4">
                {(headerSettings.left_menu || []).map((section, sIdx) => (
                  <div key={sIdx} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3 mb-3">
                      <input
                        type="text"
                        value={section.title || ''}
                        onChange={(e) => {
                          const next = [...(headerSettings.left_menu || [])];
                          next[sIdx] = { ...next[sIdx], title: e.target.value };
                          handleHeaderChange('left_menu', next);
                        }}
                        className="h-11 flex-1 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        placeholder="Section title"
                      />
                      <button
                        onClick={() => {
                          const next = (headerSettings.left_menu || []).filter((_, i) => i !== sIdx);
                          handleHeaderChange('left_menu', next);
                        }}
                        title="Remove Section"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      </button>
                    </div>
                    <div className="space-y-3">
                      {(section.items || []).map((item, iIdx) => (
                        <div key={iIdx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Label"
                            value={item.label || ''}
                            onChange={(e) => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = [...(next[sIdx].items || [])];
                              items[iIdx] = { ...items[iIdx], label: e.target.value };
                              next[sIdx] = { ...next[sIdx], items };
                              handleHeaderChange('left_menu', next);
                            }}
                            className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                          <select
                            value={item.to || ''}
                            onChange={(e) => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = [...(next[sIdx].items || [])];
                              items[iIdx] = { ...items[iIdx], to: e.target.value };
                              next[sIdx] = { ...next[sIdx], items };
                              handleHeaderChange('left_menu', next);
                            }}
                            className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                              handleHeaderChange('left_menu', next);
                            }}
                            className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => uploadLeftMenuImage(sIdx, iIdx, e.target.files?.[0])}
                            className="text-sm"
                          />
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/60 overflow-hidden flex items-center justify-center text-[10px] text-slate-400 dark:text-slate-500">
                              {item.image ? (
                                <img
                                  src={resolveImageUrl(item.image)}
                                  alt={item.label || 'Preview'}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : (
                                'No image'
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const next = [...(headerSettings.left_menu || [])];
                              const items = (next[sIdx].items || []).filter((_, i) => i !== iIdx);
                              next[sIdx] = { ...next[sIdx], items };
                              handleHeaderChange('left_menu', next);
                            }}
                            title="Remove"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const next = [...(headerSettings.left_menu || [])];
                          const items = [...(next[sIdx].items || []), { label: '', to: '', image: '' }];
                          next[sIdx] = { ...next[sIdx], items };
                          handleHeaderChange('left_menu', next);
                        }}
                        className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        + Add Item
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => handleHeaderChange('left_menu', [...(headerSettings.left_menu || []), { title: '', items: [] }])}
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  + Add Section
                </button>
              </div>
            </div>

            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Menu Labels</h3>
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
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">{item.label}</label>
                    <input
                      type="text"
                      value={headerSettings.nav_labels?.[item.key] || ''}
                      onChange={(e) => handleHeaderChange('nav_labels', {
                        ...(headerSettings.nav_labels || {}),
                        [item.key]: e.target.value,
                      })}
                      className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveHeaderSettings}
                disabled={loading}
                className="h-11 rounded-lg bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save Header Settings
              </button>
            </div>
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === 'footer' && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Footer Settings</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Configure footer content and links</p>

            {/* General Settings */}
            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">General Footer Setup</h3>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Company Name</label>
                <input
                  type="text"
                  value={footerSettings.company_name}
                  onChange={(e) => handleFooterChange('company_name', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Company Description</label>
                <textarea
                  value={footerSettings.company_description}
                  onChange={(e) => handleFooterChange('company_description', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={footerSettings.copyright_text}
                  onChange={(e) => handleFooterChange('copyright_text', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Contact Section Title</label>
                <input
                  type="text"
                  value={footerSettings.contact_title || 'CONTACT'}
                  onChange={(e) => handleFooterChange('contact_title', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={footerSettings.contact_email || ''}
                  onChange={(e) => handleFooterChange('contact_email', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Contact Phone</label>
                <input
                  type="tel"
                  value={footerSettings.contact_phone || ''}
                  onChange={(e) => handleFooterChange('contact_phone', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Contact Address</label>
                <input
                  type="text"
                  value={footerSettings.contact_address || ''}
                  onChange={(e) => handleFooterChange('contact_address', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Footer Background Color</label>
                <input
                  type="color"
                  value={footerSettings.background_color || '#6F8F72'}
                  onChange={(e) => handleFooterChange('background_color', e.target.value)}
                  className="h-10 w-20 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">Social Title</label>
                <input
                  type="text"
                  value={footerSettings.social_title || 'FOLLOW US'}
                  onChange={(e) => handleFooterChange('social_title', e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                />
              </div>

              <label className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <input
                  type="checkbox"
                  checked={footerSettings.social_enabled}
                  onChange={(e) => handleFooterChange('social_enabled', e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                Show Social Icons
              </label>
            </div>
            </div>

            {/* Social Links */}
            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Social Links</h3>
              <div className="space-y-4">
                {footerSocials.map((item, idx) => (
                  <div key={`${item.platform}-${idx}`} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <select
                      value={item.platform}
                      onChange={(e) => {
                        const next = [...footerSocials];
                        next[idx] = { ...next[idx], platform: e.target.value };
                        setFooterSocials(next);
                      }}
                      className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                        className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => setFooterSocials(footerSocials.filter((_, i) => i !== idx))}
                      title="Remove"
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setFooterSocials([...footerSocials, { platform: 'facebook', url: '' }])}
                  className="h-10 rounded-lg border border-slate-300 dark:border-slate-600 px-4 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  + Add Social Link
                </button>
              </div>
            </div>

            {/* Footer Sections */}
            <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-700 p-5 bg-white dark:bg-slate-900">
              <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Footer Link Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Object.entries(footerSections).map(([sectionKey, section]) => (
                <div key={sectionKey} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
                  <input
                    type="text"
                    value={section?.title || sectionKey.toUpperCase()}
                    onChange={(e) => setFooterSections(prev => ({
                      ...prev,
                      [sectionKey]: { ...prev[sectionKey], title: e.target.value }
                    }))}
                    className="h-11 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm font-semibold mb-4 focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <div className="space-y-3">
                    {(section?.items || []).map((link, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Label"
                          value={link.label}
                          onChange={(e) => handleFooterLinkChange(sectionKey, idx, 'label', e.target.value)}
                          className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                        <select
                          value={link.link}
                          onChange={(e) => handleFooterLinkChange(sectionKey, idx, 'link', e.target.value)}
                          className="h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        >
                          <option value="">Select a page</option>
                          {footerLinkOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveFooterLink(sectionKey, idx)}
                          title="Remove Link"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddFooterLink(sectionKey)}
                      className="h-10 w-full rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={saveFooterSettings}
                disabled={loading}
                className="h-11 rounded-lg bg-black px-6 text-sm font-semibold text-white disabled:opacity-50"
              >
                Save Footer Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

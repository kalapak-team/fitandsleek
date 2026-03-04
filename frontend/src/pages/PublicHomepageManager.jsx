import React, { useState, useEffect } from 'react';
import api from '../lib/api';

export default function PublicHomepageManager() {
  const [activeTab, setActiveTab] = useState('sections');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sections data
  const [sections, setSections] = useState({
    discounts: { title: 'Discounts', enabled: true, order: 1 },
    clothes: { title: 'Clothes', enabled: true, order: 2 },
    shoes: { title: 'Shoes', enabled: true, order: 3 },
    belts: { title: 'Belts', enabled: true, order: 4 },
  });

  // Header data
  const [headerSettings, setHeaderSettings] = useState({
    logo_text: 'FIT&SLEEK',
    search_enabled: true,
    cart_enabled: true,
    wishlist_enabled: true,
    language_enabled: true,
  });

  // Footer data
  const [footerSettings, setFooterSettings] = useState({
    company_name: 'FIT&SLEEK Pro',
    company_description: 'Your fashion destination',
    support_enabled: true,
    tracking_enabled: true,
    privacy_enabled: true,
    contact_enabled: true,
    copyright_text: '© 2026 FIT&SLEEK Pro. All rights reserved.',
  });

  // Footer links sections
  const [footerSections, setFooterSections] = useState({
    support: [
      { label: 'Help Center', link: '/support' },
      { label: 'FAQ', link: '/faq' },
      { label: 'Contact Us', link: '/contact' },
    ],
    tracking: [
      { label: 'Track Order', link: '/track-order' },
      { label: 'Returns', link: '/returns' },
      { label: 'Shipping Info', link: '/shipping' },
    ],
    legal: [
      { label: 'Privacy Policy', link: '/privacy' },
      { label: 'Terms & Conditions', link: '/terms' },
      { label: 'Cookies Policy', link: '/cookies' },
    ],
  });

  // Load settings from API on component mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);
        const response = await api.get('/homepage-settings');
        
        if (response.data) {
          setSections(response.data.sections || sections);
          setHeaderSettings(response.data.header || headerSettings);
          setFooterSettings(response.data.footer || footerSettings);
          setFooterSections(response.data.footer_sections || footerSections);
          setSuccess('✅ Settings loaded successfully!');
        }
      } catch (err) {
        console.warn('Using default settings:', err.message);
        setSuccess('📝 Using default settings');
      } finally {
        setLoading(false);
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
        order: parseInt(newOrder)
      }
    }));
  };

  const handleHeaderChange = (key, value) => {
    setHeaderSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFooterChange = (key, value) => {
    setFooterSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFooterLinkChange = (section, index, field, value) => {
    setFooterSections(prev => {
      const newSection = [...prev[section]];
      newSection[index] = { ...newSection[index], [field]: value };
      return { ...prev, [section]: newSection };
    });
  };

  const handleAddFooterLink = (section) => {
    setFooterSections(prev => ({
      ...prev,
      [section]: [...prev[section], { label: '', link: '' }]
    }));
  };

  const handleRemoveFooterLink = (section, index) => {
    setFooterSections(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const saveSections = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/sections', { sections });
      setSuccess('✅ Homepage sections saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ Admin authentication required to save');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveHeaderSettings = async () => {
    try {
      setLoading(true);
      setError('');
      await api.put('/admin/homepage-settings/header', headerSettings);
      setSuccess('✅ Header settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ Admin authentication required to save');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const saveFooterSettings = async () => {
    try {
      setLoading(true);
      setError('');
      await Promise.all([
        api.put('/admin/homepage-settings/footer', footerSettings),
        api.put('/admin/homepage-settings/footer-sections', { footer_sections: footerSections })
      ]);
      setSuccess('✅ Footer settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Save error:', err);
      if (err.response?.status === 401) {
        setError('⚠️ Admin authentication required to save');
      } else {
        setError('Failed to save: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏠 Homepage Manager</h1>
          <p className="text-gray-600">Manage all homepage content: sections, header, and footer</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-sm font-semibold hover:underline">Dismiss</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 flex-wrap">
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'sections'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📄 Page Sections
          </button>
          <button
            onClick={() => setActiveTab('header')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'header'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔝 Header Settings
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`px-4 py-3 font-semibold transition-colors ${
              activeTab === 'footer'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            🔚 Footer Settings
          </button>
        </div>

        {/* Sections Tab */}
        {activeTab === 'sections' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Homepage Sections</h2>
            <p className="text-gray-600 mb-6">Manage which sections appear on the homepage and set their display order.</p>

            <div className="space-y-4 mb-8">
              {Object.entries(sections).map(([key, section]) => (
                <div key={key} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-4 flex-wrap">
                    <input
                      type="checkbox"
                      checked={section.enabled}
                      onChange={() => handleSectionToggle(key)}
                      className="w-5 h-5 text-blue-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                      <p className="text-sm text-gray-500">{key}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Order:</label>
                      <input
                        type="number"
                        value={section.order}
                        onChange={(e) => handleSectionOrderChange(key, e.target.value)}
                        min="1"
                        max="10"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
                      />
                    </div>
                  </div>
                  {section.enabled ? (
                    <div className="mt-2 text-sm text-green-600 font-medium">✓ Enabled</div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-500">⊘ Disabled</div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={saveSections}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? '💾 Saving...' : '💾 Save Section Settings'}
            </button>
          </div>
        )}

        {/* Header Tab */}
        {activeTab === 'header' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Header Settings</h2>
            <p className="text-gray-600 mb-6">Configure header elements and features</p>

            <div className="space-y-6 mb-8 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Logo Text</label>
                <input
                  type="text"
                  value={headerSettings.logo_text}
                  onChange={(e) => handleHeaderChange('logo_text', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">Enabled Features</h3>
                {['search_enabled', 'cart_enabled', 'wishlist_enabled', 'language_enabled'].map(feature => (
                  <label key={feature} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={headerSettings[feature]}
                      onChange={(e) => handleHeaderChange(feature, e.target.checked)}
                      className="w-5 h-5 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {feature.replace(/_/g, ' ').replace('enabled', '').toUpperCase().trim()}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={saveHeaderSettings}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? '💾 Saving...' : '💾 Save Header Settings'}
            </button>
          </div>
        )}

        {/* Footer Tab */}
        {activeTab === 'footer' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-6">Footer Settings</h2>
            <p className="text-gray-600 mb-6">Configure footer content and links</p>

            <div className="space-y-6 mb-8 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Company Name</label>
                <input
                  type="text"
                  value={footerSettings.company_name}
                  onChange={(e) => handleFooterChange('company_name', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Company Description</label>
                <textarea
                  value={footerSettings.company_description}
                  onChange={(e) => handleFooterChange('company_description', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={footerSettings.copyright_text}
                  onChange={(e) => handleFooterChange('copyright_text', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Footer Sections */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {Object.entries(footerSections).map(([sectionKey, links]) => (
                <div key={sectionKey} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-4 text-lg capitalize">{sectionKey}</h3>
                  <div className="space-y-3">
                    {links.map((link, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Label"
                          value={link.label}
                          onChange={(e) => handleFooterLinkChange(sectionKey, idx, 'label', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          placeholder="URL"
                          value={link.link}
                          onChange={(e) => handleFooterLinkChange(sectionKey, idx, 'link', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleRemoveFooterLink(sectionKey, idx)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          ❌ Remove Link
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handleAddFooterLink(sectionKey)}
                      className="w-full px-3 py-2 text-sm border border-blue-300 text-blue-600 rounded hover:bg-blue-50 font-medium"
                    >
                      ➕ Add Link
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={saveFooterSettings}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? '💾 Saving...' : '💾 Save Footer Settings'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

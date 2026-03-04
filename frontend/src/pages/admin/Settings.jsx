import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { useTheme } from "../../state/theme.jsx";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const { mode, primaryColor, setMode, setPrimaryColor, saveTheme, normalizeHexColor } = useTheme();

  // Form state
  const [form, setForm] = useState({
    site_name: "Fit&Sleek",
    site_description: "",
    contact_email: "",
    contact_phone: "",
    currency: "USD",
    tax_rate: "0",
    free_shipping_threshold: "0",
    social_facebook: "",
    social_instagram: "",
    social_twitter: "",
    font_en: "Inter",
    font_km: "Noto Sans Khmer",
    admin_theme_mode: "light",
    admin_primary_color: "#F58E27",
    privacy_content: "",
    terms_content: "",
  });

  const formThemeMode = form.admin_theme_mode || mode;
  const formPrimaryColor = form.admin_primary_color || primaryColor;
  const accentColor = formThemeMode === "dark" ? "#FFFFFF" : formPrimaryColor;
  const accentIsWhite = (accentColor || "").toUpperCase() === "#FFFFFF";
  const headerIconColor = accentIsWhite ? "#0b0b0f" : "#FFFFFF";

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/settings");
      const grouped = res.data || {};
      
      // Convert to flat form object
      const flatForm = { ...form };
      Object.values(grouped).flat().forEach(s => {
        if (flatForm.hasOwnProperty(s.key)) {
          flatForm[s.key] = s.value;
        }
      });

      const loadedMode = flatForm.admin_theme_mode === "dark" ? "dark" : "light";
      const loadedColor = normalizeHexColor(flatForm.admin_primary_color || "#F58E27");
      flatForm.admin_theme_mode = loadedMode;
      flatForm.admin_primary_color = loadedColor;

      setForm(flatForm);
      setSettings(grouped);
    } catch (e) {
      console.error("Failed to load settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const normalizedThemeMode = formThemeMode === "dark" ? "dark" : "light";
      const normalizedThemeColor = normalizeHexColor(formPrimaryColor || "#F58E27");
      const payloadForm = {
        ...form,
        admin_theme_mode: normalizedThemeMode,
        admin_primary_color: normalizedThemeColor,
      };

      // Convert form to settings array
      const settingsArray = Object.entries(payloadForm).map(([key, value]) => ({ key, value }));
      await api.put("/admin/settings/bulk", { settings: settingsArray });
      saveTheme(normalizedThemeMode, normalizedThemeColor);
      setForm(payloadForm);
      setSuccess("Settings saved successfully!");
      setTimeout(() => setSuccess(""), 3000);
      loadSettings();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key, value) => {
    setForm(s => ({ ...s, [key]: value }));
  };

  const handleThemeModeChange = (nextMode) => {
    const modeValue = nextMode === "dark" ? "dark" : "light";
    setMode(modeValue);
    handleChange("admin_theme_mode", modeValue);
  };

  const handleThemeColorChange = (nextColor) => {
    const colorValue = normalizeHexColor(nextColor || "#F58E27");
    setPrimaryColor(colorValue);
    handleChange("admin_primary_color", colorValue);
  };

  if (loading) return <AdminContentSkeleton lines={3} imageHeight={180} className="mt-4" />;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-emerald-700 font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 font-medium">{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: headerIconColor }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </span>
            Settings
          </h1>
          <p className="text-slate-500 text-lg">Configure your store settings and preferences</p>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: "var(--admin-primary)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v2m0 14v2m9-9h-2M5 12H3m15.364 6.364l-1.414-1.414M7.05 7.05 5.636 5.636m12.728 0L16.95 7.05M7.05 16.95l-1.414 1.414" />
              </svg>
              Appearance
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Theme Mode</label>
                <select
                  value={formThemeMode}
                  onChange={(e) => handleThemeModeChange(e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formPrimaryColor}
                    onChange={(e) => handleThemeColorChange(e.target.value)}
                    className="h-12 w-14 p-1 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formPrimaryColor}
                    onChange={(e) => handleThemeColorChange(e.target.value)}
                    className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                    placeholder="#F58E27"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Admin accent color (default: #F58E27)</p>
              </div>
            </div>
          </div>

          {/* General Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              General
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Site Name</label>
                <input
                  type="text"
                  value={form.site_name}
                  onChange={(e) => handleChange('site_name', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Contact Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => handleChange('contact_email', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Site Description</label>
                <textarea
                  value={form.site_description}
                  onChange={(e) => handleChange('site_description', e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 text-slate-700 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Commerce Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Commerce
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="THB">THB (฿)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.tax_rate}
                  onChange={(e) => handleChange('tax_rate', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Free Shipping Threshold</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.free_shipping_threshold}
                  onChange={(e) => handleChange('free_shipping_threshold', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Typography Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 20h16M6 16h12M8 12h8M9 8h6M10 4h4" />
              </svg>
              Typography
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">English Font</label>
                <input
                  list="font-en-options"
                  value={form.font_en}
                  onChange={(e) => handleChange('font_en', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="Inter"
                />
                <datalist id="font-en-options">
                  <option value="Inter" />
                  <option value="Poppins" />
                  <option value="Roboto" />
                  <option value="Montserrat" />
                  <option value="System" />
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Khmer Font</label>
                <input
                  list="font-km-options"
                  value={form.font_km}
                  onChange={(e) => handleChange('font_km', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="Noto Sans Khmer"
                />
                <datalist id="font-km-options">
                  <option value="Noto Sans Khmer" />
                  <option value="Kantumruy Pro" />
                  <option value="Battambang" />
                  <option value="System" />
                </datalist>
              </div>
              <p className="text-xs text-slate-500 md:col-span-2">
                Tip: Fonts must be loaded in the frontend. Use the provided options for best results.
              </p>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              Social Media
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Facebook URL</label>
                <input
                  type="url"
                  value={form.social_facebook}
                  onChange={(e) => handleChange('social_facebook', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="https://facebook.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Instagram URL</label>
                <input
                  type="url"
                  value={form.social_instagram}
                  onChange={(e) => handleChange('social_instagram', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="https://instagram.com/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Twitter URL</label>
                <input
                  type="url"
                  value={form.social_twitter}
                  onChange={(e) => handleChange('social_twitter', e.target.value)}
                  className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="https://twitter.com/..."
                />
              </div>
            </div>
          </div>

          {/* Legal Pages */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm p-6 border border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" style={{ color: accentColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Legal Pages
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Privacy Policy Content</label>
                <textarea
                  value={form.privacy_content}
                  onChange={(e) => handleChange('privacy_content', e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="Enter privacy policy text..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Terms & Conditions Content</label>
                <textarea
                  value={form.terms_content}
                  onChange={(e) => handleChange('terms_content', e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-4 text-slate-700 dark:text-slate-100 outline-none"
                  placeholder="Enter terms and conditions text..."
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className={`h-12 px-8 rounded-xl font-semibold shadow-sm disabled:opacity-50 flex items-center gap-2 ${accentIsWhite ? "border border-slate-300" : "text-white"}`}
              style={{ backgroundColor: accentColor, color: accentIsWhite ? "#0b0b0f" : "#FFFFFF" }}
            >
              {saving ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


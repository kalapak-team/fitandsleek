// ✅ FILE: frontend/src/pages/admin/HomePageManager.jsx
// Fixes:
// 1) Correctly reads Laravel responses: { data: [...] }
// 2) Uses FormData + real file upload (NOT base64) for banners/collections
// 3) Separate editing states for banners vs collections
// 4) Robust error messages (401/422/500)
// 5) Handles 401 by triggering auth refresh
// 6) Keeps your UI exactly (only logic fixed)

import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import { resolveImageUrl } from "../../lib/images";
import { useAuth } from "../../state/auth";
import { warningConfirm } from "../../lib/swal";
import { useTheme } from "../../state/theme.jsx";
import { AdminSectionLoader, AdminContentSkeleton } from "@/components/admin/AdminLoading";

const pickList = (res) => {
  // supports: {data:[...]} OR {data:{data:[...]}} OR [...]
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.results)) return d.results;
  return [];
};

const extractErr = (e, refreshAuth) => {
  const status = e?.response?.status;
  if (status === 401) {
    // Try to refresh auth before showing error
    refreshAuth?.();
    return "Unauthorized (401). Please login again.";
  }
  if (status === 403) return "Forbidden (403). Admin permission required.";
  if (status === 404) return "Not found (404). API route missing.";
  if (status === 413) return "File too large (413). Please upload a smaller video/GIF.";
  if (status === 422) {
    const msg = e?.response?.data?.message || "Validation failed (422).";
    const errs = e?.response?.data?.errors;
    if (errs && typeof errs === "object") {
      const flat = Object.entries(errs)
        .map(([k, v]) => `${k}: ${(Array.isArray(v) ? v.join(", ") : v)}`)
        .join(" | ");
      return `${msg} ${flat}`;
    }
    return msg;
  }
  return e?.response?.data?.message || e?.message || "Failed to load/save data.";
};

export default function HomePageManager() {
  const { refresh: refreshAuth } = useAuth();
  const { primaryColor, mode } = useTheme();
  const accentColor = mode === "dark" ? "#FFFFFF" : primaryColor;
  const accentIsWhite = (accentColor || "").toUpperCase() === "#FFFFFF";
  const accentText = accentIsWhite ? "#0b0b0f" : "#FFFFFF";
  const [activeTab, setActiveTab] = useState("banners");
  const [banners, setBanners] = useState([]);
  const [collections, setCollections] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [showBannerForm, setShowBannerForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [bannerViewMode, setBannerViewMode] = useState("list");
  const [collectionViewMode, setCollectionViewMode] = useState("list");

  // ----- Banner form -----
  const [bannerEditingId, setBannerEditingId] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(""); // preview URL (either from server or local blob)

  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    link_url: "",
    position: "hero",
    is_active: true,
    order: 0,
    media_url: "",
  });

  // ----- Collection form -----
  const [collectionEditingId, setCollectionEditingId] = useState(null);
  const [collectionFile, setCollectionFile] = useState(null);
  const [collectionPreview, setCollectionPreview] = useState("");

  const [collectionForm, setCollectionForm] = useState({
    name: "",
    gender: "women",
    link: "",
    text_position: "overlay",
    is_active: true,
    sort_order: 0,
  });

  const triggerAuthRefresh = async () => {
    try {
      await refreshAuth();
    } catch (e) {
      console.warn('Auth refresh failed');
    }
  };

  const resetBannerForm = () => {
    setShowBannerForm(false);
    setBannerEditingId(null);
    setBannerFile(null);
    setBannerPreview("");
    setBannerForm({
      title: "",
      subtitle: "",
      link_url: "",
      position: "hero",
      is_active: true,
      order: banners.length,
      media_url: "",
    });
  };

  const resetCollectionForm = () => {
    setShowCollectionForm(false);
    setCollectionEditingId(null);
    setCollectionFile(null);
    setCollectionPreview("");
    setCollectionForm({
      name: "",
      gender: "women",
      link: "",
      text_position: "overlay",
      is_active: true,
      sort_order: collections.length,
    });
  };

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 3000);
  };

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const [bannersRes, collectionsRes, categoriesRes] = await Promise.all([
        api.get("/admin/banners"),
        api.get("/admin/collections"),
        api.get("/categories"),
      ]);

      setBanners(pickList(bannersRes));
      setCollections(pickList(collectionsRes));
      setCategories(pickList(categoriesRes));
    } catch (e) {
      setErr(extractErr(e, triggerAuthRefresh));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- FILE PREVIEW HELPERS --------
  const makeLocalPreview = (file) => (file ? URL.createObjectURL(file) : "");

  const onPickBannerFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(makeLocalPreview(file));
  };

  const onPickCollectionFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCollectionFile(file);
    setCollectionPreview(makeLocalPreview(file));
  };

  // -------- SAVE BANNER (multipart) --------
  const saveBanner = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const fd = new FormData();
      fd.append("title", bannerForm.title || "");
      fd.append("subtitle", bannerForm.subtitle || "");
      fd.append("link_url", bannerForm.link_url || "");
      fd.append("position", bannerForm.position || "hero");
      fd.append("is_active", bannerForm.is_active ? "1" : "0");
      fd.append("order", String(bannerForm.order ?? 0));
      if (bannerForm.media_url) fd.append("media_url", bannerForm.media_url);

      // backend usually expects: image (file). If your backend uses "image", keep "image".
      if (bannerFile) fd.append("image", bannerFile);

      if (bannerEditingId) {
        // Laravel PUT with multipart: use POST + _method=PUT
        fd.append("_method", "PUT");
        await api.post(`/admin/banners/${bannerEditingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Banner updated!");
      } else {
        await api.post("/admin/banners", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Banner created!");
      }

      resetBannerForm();
      await load();
    } catch (e2) {
      setErr(extractErr(e2, triggerAuthRefresh));
    }
  };

  // -------- SAVE COLLECTION (multipart) --------
  const saveCollection = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      const fd = new FormData();
      fd.append("name", collectionForm.name || "");
      fd.append("gender", collectionForm.gender || "women");
      fd.append("text_position", collectionForm.text_position || "overlay");
      fd.append("link", collectionForm.link || "");
      fd.append("is_active", collectionForm.is_active ? "1" : "0");
      fd.append("sort_order", String(collectionForm.sort_order ?? 0));

      // backend usually expects: image (file)
      if (collectionFile) fd.append("image", collectionFile);

      if (collectionEditingId) {
        fd.append("_method", "PUT");
        await api.post(`/admin/collections/${collectionEditingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Collection updated!");
      } else {
        await api.post("/admin/collections", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        showSuccess("Collection created!");
      }

      resetCollectionForm();
      await load();
    } catch (e2) {
      setErr(extractErr(e2, triggerAuthRefresh));
    }
  };

  // -------- DELETE --------
  const deleteBanner = async (id) => {
    const confirmRes = await warningConfirm({
      khTitle: "លុប Banner",
      enTitle: "Delete banner",
      khText: "តើអ្នកចង់លុប Banner នេះមែនទេ?",
      enText: "Delete this banner?",
    });
    if (!confirmRes.isConfirmed) return;
    setErr("");
    try {
      await api.delete(`/admin/banners/${id}`);
      showSuccess("Banner deleted");
      await load();
    } catch (e) {
      setErr(extractErr(e, triggerAuthRefresh));
    }
  };

  const deleteCollection = async (id) => {
    const confirmRes = await warningConfirm({
      khTitle: "លុប Collection",
      enTitle: "Delete collection",
      khText: "តើអ្នកចង់លុប Collection នេះមែនទេ?",
      enText: "Delete this collection?",
    });
    if (!confirmRes.isConfirmed) return;
    setErr("");
    try {
      await api.delete(`/admin/collections/${id}`);
      showSuccess("Collection deleted");
      await load();
    } catch (e) {
      setErr(extractErr(e, triggerAuthRefresh));
    }
  };

  // -------- EDIT --------
  const editBanner = (b) => {
    setActiveTab("banners");
    setShowBannerForm(true);
    setBannerEditingId(b.id);
    setBannerFile(null);
    setBannerPreview(resolveImageUrl(b.image_url || b.image || b.image_path || ""));
    // Ensure position is always set to a valid value from dropdown
    const validPositions = ["hero", "mid", "sidebar", "popup", "promo"];
    const bannerPosition = b.position && validPositions.includes(b.position) ? b.position : "hero";
    setBannerForm({
      title: b.title || "",
      subtitle: b.subtitle || "",
      link_url: b.link_url || b.link || "",
      position: bannerPosition,
      is_active: !!b.is_active,
      order: b.order ?? 0,
      media_url: b.image_url || "",
    });
  };

  const editCollection = (c) => {
    setActiveTab("collections");
    setShowCollectionForm(true);
    setCollectionEditingId(c.id);
    setCollectionFile(null);
    setCollectionPreview(resolveImageUrl(c.image_url || c.image || c.image_path || ""));
    setCollectionForm({
      name: c.name || "",
      gender: c.gender || "women",
      link: c.link || "",
      text_position: c.text_position || "overlay",
      is_active: !!c.is_active,
      sort_order: c.sort_order ?? 0,
    });
  };

  if (loading) return <AdminContentSkeleton title="Home Page Manager" />;

  // -------- UI --------
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 sm:p-8 text-slate-900 dark:text-slate-100">
      {success && (
        <div className="fixed top-6 right-6 z-50 rounded-xl border border-slate-200 dark:border-green-700/60 bg-black dark:bg-green-600/80 px-5 py-3 text-white shadow-xl flex items-center gap-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-medium">{success}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-slate-700 dark:text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </span>
            Home Page Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Manage banners and collection tiles for your homepage</p>
        </div>

        {err && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-700/60 bg-red-50 dark:bg-red-900/40 p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-500 dark:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-200 font-medium">{err}</span>
            <button onClick={() => setErr("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1">
            {["banners", "collections"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab
                  ? "bg-black text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {activeTab === "banners" ? (
            <button
              onClick={() => {
                setBannerEditingId(null);
                setShowBannerForm(true);
                setBannerFile(null);
                setBannerPreview("");
                setBannerForm({
                  title: "",
                  subtitle: "",
                  link_url: "",
                  position: "hero",
                  is_active: true,
                  order: banners.length,
                  media_url: "",
                });
              }}
              className="h-11 px-4 rounded-xl bg-black text-white text-sm font-semibold"
            >
              New Banner
            </button>
          ) : (
            <button
              onClick={() => {
                setCollectionEditingId(null);
                setShowCollectionForm(true);
                setCollectionFile(null);
                setCollectionPreview("");
                setCollectionForm({
                  name: "",
                  gender: "women",
                  link: "",
                  text_position: "overlay",
                  is_active: true,
                  sort_order: collections.length,
                });
              }}
              className="h-11 px-4 rounded-xl bg-black text-white text-sm font-semibold"
            >
              New Collection
            </button>
          )}
        </div>

        {/* ---------------- BANNERS ---------------- */}
        {activeTab === "banners" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {(showBannerForm || bannerEditingId) && (
              <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  {bannerEditingId ? "Edit Banner" : "New Banner"}
                </h2>

                <form onSubmit={saveBanner} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Title</label>
                    <input
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm((s) => ({ ...s, title: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      placeholder="Banner title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Subtitle</label>
                    <input
                      value={bannerForm.subtitle}
                      onChange={(e) => setBannerForm((s) => ({ ...s, subtitle: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      placeholder="Banner subtitle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Link URL</label>
                    <input
                      value={bannerForm.link_url}
                      onChange={(e) => setBannerForm((s) => ({ ...s, link_url: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      placeholder="/products"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Position</label>
                    <select
                      value={bannerForm.position}
                      onChange={(e) => setBannerForm((s) => ({ ...s, position: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                    >
                      <option value="hero">Hero (Main Banner)</option>
                      <option value="mid">Mid Page</option>
                      <option value="sidebar">Sidebar</option>
                      <option value="popup">Popup</option>
                      <option value="promo">Promo Slider</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Media URL (Image/GIF/Video)</label>
                    <input
                      value={bannerForm.media_url}
                      onChange={(e) => setBannerForm((s) => ({ ...s, media_url: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Image</label>
                    <div className="flex gap-2">
                      <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-900/40">
                        {bannerPreview ? (
                          <img
                            src={resolveImageUrl(bannerPreview)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={onPickBannerFile}
                        className="flex-1 text-sm file:mr-3 file:rounded-md file:border file:border-slate-300 dark:file:border-slate-600 file:bg-white dark:file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 dark:file:text-slate-200"
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Tip: select a new image only when you want to replace it.</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bannerForm.is_active}
                        onChange={(e) => setBannerForm((s) => ({ ...s, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Active</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      style={{
                        backgroundColor: accentColor,
                        color: accentText,
                        borderColor: accentColor,
                      }}
                      className="flex-1 h-12 rounded-xl text-sm font-semibold transition-all duration-200 border"
                    >
                      {bannerEditingId ? "Edit Banner" : "Create Banner"}
                    </button>

                    {(showBannerForm || bannerEditingId) && (
                      <button
                        type="button"
                        onClick={resetBannerForm}
                        className="px-4 h-11 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
              </div>
            )}

            {(!showBannerForm && !bannerEditingId) && (
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All Banners ({banners.length})</h2>
                    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                      {[
                        { value: "list", label: "List" },
                        { value: "grid", label: "Grid" },
                        { value: "split", label: "Split" },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setBannerViewMode(mode.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${bannerViewMode === mode.value
                            ? "bg-black text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                            }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                {loading ? (
                  <AdminSectionLoader rows={4} />
                ) : banners.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">No banners yet</div>
                ) : (
                  <div className={bannerViewMode === "list" ? "space-y-4" : bannerViewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>
                    {banners.map((b) => {
                      const img = b.image_url || b.image || b.image_path || "";
                      return (
                        <div
                          key={b.id}
                          className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${bannerViewMode === "list" ? "flex items-center gap-4 p-4" : bannerViewMode === "grid" ? "p-3" : "flex items-start gap-4 p-4"}`}
                        >
                          <img
                            src={resolveImageUrl(img)}
                            alt={b.title}
                            className={`${bannerViewMode === "grid" ? "w-full h-44 mb-3" : "w-24 h-16"} object-cover rounded-lg`}
                          />

                          <div className={bannerViewMode === "grid" ? "space-y-2" : "flex-1"}>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{b.title || "Untitled"}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{(b.position || "hero")} • Order: {b.order ?? 0}</p>

                            {bannerViewMode === "grid" && (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${b.is_active ? "border-black bg-black text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300"}`}
                              >
                                {b.is_active ? "Active" : "Inactive"}
                              </span>
                            )}
                          </div>

                          {bannerViewMode !== "grid" && (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${b.is_active ? "border-black bg-black text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300"}`}
                            >
                              {b.is_active ? "Active" : "Inactive"}
                            </span>
                          )}

                          <div className={`flex gap-2 ${bannerViewMode === "grid" ? "mt-3" : ""}`}>
                            <button
                              onClick={() => editBanner(b)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteBanner(b.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------------- COLLECTIONS ---------------- */}
        {activeTab === "collections" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {(showCollectionForm || collectionEditingId) && (
              <div className="lg:col-span-3">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  {collectionEditingId ? "Edit Collection" : "New Collection"}
                </h2>

                <form onSubmit={saveCollection} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Name *</label>
                    <input
                      value={collectionForm.name}
                      onChange={(e) => setCollectionForm((s) => ({ ...s, name: e.target.value }))}
                      required
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      placeholder="Collection name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Gender *</label>
                    <select
                      value={collectionForm.gender}
                      onChange={(e) => setCollectionForm((s) => ({ ...s, gender: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                    >
                      <option value="women">Women</option>
                      <option value="men">Men</option>
                      <option value="boys">Boys</option>
                      <option value="girls">Girls</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Link (optional)</label>
                    <input
                      value={collectionForm.link}
                      onChange={(e) => setCollectionForm((s) => ({ ...s, link: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      placeholder="/search?parent_category=Women"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={collectionForm.sort_order}
                      onChange={(e) => setCollectionForm((s) => ({ ...s, sort_order: Number(e.target.value || 0) }))}
                      className="w-full h-11 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm focus:border-black focus:ring-0 outline-none bg-white dark:bg-slate-900/60 text-slate-900 dark:text-slate-100"
                      min={0}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Image</label>
                    <div className="flex gap-2">
                      <div className="w-20 h-20 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-50 dark:bg-slate-900/40">
                        {collectionPreview ? (
                          <img
                            src={resolveImageUrl(collectionPreview)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={onPickCollectionFile}
                        className="flex-1 text-sm file:mr-3 file:rounded-md file:border file:border-slate-300 dark:file:border-slate-600 file:bg-white dark:file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:text-slate-700 dark:file:text-slate-200"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={collectionForm.is_active}
                        onChange={(e) => setCollectionForm((s) => ({ ...s, is_active: e.target.checked }))}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Active</span>
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      style={{
                        backgroundColor: accentColor,
                        color: accentText,
                        borderColor: accentColor,
                      }}
                      className="flex-1 h-12 rounded-xl text-sm font-semibold transition-all duration-200 border"
                    >
                      {collectionEditingId ? "Edit Collection" : "Create Collection"}
                    </button>

                    {(showCollectionForm || collectionEditingId) && (
                      <button
                        type="button"
                        onClick={resetCollectionForm}
                        className="px-4 h-11 rounded-lg border border-slate-300 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
              </div>
            )}

            {(!showCollectionForm && !collectionEditingId) && (
              <div className="lg:col-span-3">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All Collections ({collections.length})</h2>
                    <div className="inline-flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1">
                      {[
                        { value: "list", label: "List" },
                        { value: "grid", label: "Grid" },
                        { value: "split", label: "Split" },
                      ].map((mode) => (
                        <button
                          key={mode.value}
                          type="button"
                          onClick={() => setCollectionViewMode(mode.value)}
                          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${collectionViewMode === mode.value
                            ? "bg-black text-white"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/70"
                            }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>
                  </div>

                {loading ? (
                  <AdminSectionLoader rows={4} />
                ) : collections.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">No collections yet</div>
                ) : (
                  <div className={collectionViewMode === "list" ? "space-y-4" : collectionViewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 lg:grid-cols-2"}>
                    {collections.map((c) => {
                      const img = c.image_url || c.image || c.image_path || "";
                      return (
                        <div
                          key={c.id}
                          className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 ${collectionViewMode === "list" ? "flex items-center gap-4 p-4" : collectionViewMode === "grid" ? "p-3" : "flex items-start gap-4 p-4"}`}
                        >
                          <img
                            src={resolveImageUrl(img)}
                            alt={c.name}
                            className={`${collectionViewMode === "grid" ? "w-full h-56 mb-3" : collectionViewMode === "split" ? "w-40 h-28" : "w-32 h-24"} object-cover rounded-lg border border-slate-200`}
                          />

                          <div className={collectionViewMode === "grid" ? "space-y-2" : "flex-1"}>
                            <h3 className="font-semibold text-slate-900 dark:text-white">{c.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">{(c.gender || "women").toUpperCase()} • Order: {c.sort_order ?? 0}</p>

                            {collectionViewMode === "grid" && (
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${c.is_active ? "border-black bg-black text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300"}`}
                              >
                                {c.is_active ? "Active" : "Inactive"}
                              </span>
                            )}
                          </div>

                          {collectionViewMode !== "grid" && (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${c.is_active ? "border-black bg-black text-white" : "border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300"}`}
                            >
                              {c.is_active ? "Active" : "Inactive"}
                            </span>
                          )}

                          <div className={`flex gap-2 ${collectionViewMode === "grid" ? "mt-3" : ""}`}>
                            <button
                              onClick={() => editCollection(c)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteCollection(c.id)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

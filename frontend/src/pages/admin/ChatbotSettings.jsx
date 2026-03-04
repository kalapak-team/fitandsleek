import React, { useEffect, useState } from "react";
import api from "../../lib/api";
import { AdminContentSkeleton } from "@/components/admin/AdminLoading";

const PLATFORMS = [
  { value: "messenger",  label: "Facebook Messenger", placeholder: "https://m.me/yourpage",      color: "bg-blue-600"   },
  { value: "telegram",   label: "Telegram",            placeholder: "https://t.me/yourhandle",   color: "bg-sky-500"    },
  { value: "instagram",  label: "Instagram",           placeholder: "https://instagram.com/you", color: "bg-pink-600"   },
  { value: "whatsapp",   label: "WhatsApp",            placeholder: "https://wa.me/1234567890",  color: "bg-green-500"  },
  { value: "tiktok",     label: "TikTok",              placeholder: "https://tiktok.com/@you",   color: "bg-slate-900"  },
  { value: "youtube",    label: "YouTube",             placeholder: "https://youtube.com/@you",  color: "bg-red-600"    },
  { value: "twitter",    label: "Twitter / X",         placeholder: "https://x.com/yourhandle",  color: "bg-slate-800"  },
  { value: "line",       label: "Line",                placeholder: "https://line.me/...",        color: "bg-green-600"  },
  { value: "custom",     label: "Custom",              placeholder: "https://...",               color: "bg-slate-500"  },
];

const PLATFORM_ICONS = {
  messenger: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.892 1.44 5.476 3.696 7.17V22l3.378-1.858C10.053 20.37 11.011 20.5 12 20.5c5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.007 12.461-2.55-2.72-4.98 2.72 5.476-5.813 2.614 2.72 4.916-2.72-5.476 5.813z" />
    </svg>
  ),
  telegram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M11.944 0A12 12 0 1124 12 12 12 0 0111.944 0zM8.531 16.75l-.352-3.703 8.885-8.027c.39-.348-.083-.514-.6-.197L6.088 12.5 2.44 11.388c-.837-.264-.85-.837.173-1.237L20.42 3.437c.7-.316 1.308.17 1.076 1.207L18.41 16.75c-.19.87-.73 1.08-1.477.675L13.7 15.01l-1.973 1.9c-.22.213-.4.39-.817.39z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.44-.644 1.44-1.44-.644-1.44-1.44-1.44z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.77 1.52V6.92a4.85 4.85 0 01-1-.23z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  twitter: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  line: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.630 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.630v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.630-.63.346 0 .628.285.628.630v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.630v4.141h1.756c.348 0 .629.283.629.630 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  ),
  custom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ),
};

const defaults = {
  enabled: true,
  greeting: "Hi there 👋",
  welcome: "How can we help you today?",
};

let nextId = 100;

const parseSocialLinks = (data) => {
  if (data.social_links) {
    // Backend returns social_links as a decoded array; handle both array and JSON string
    let arr = data.social_links;
    if (typeof arr === "string") {
      try { arr = JSON.parse(arr); } catch { arr = []; }
    }
    if (Array.isArray(arr) && arr.length > 0) return arr.map((l) => ({ ...l, id: l.id ?? nextId++ }));
  }
  // Fall back to legacy flat fields
  const links = [];
  if (data.messenger_url)  links.push({ id: nextId++, platform: "messenger",  label: "Facebook Messenger", url: data.messenger_url });
  if (data.telegram_url)   links.push({ id: nextId++, platform: "telegram",   label: "Telegram",           url: data.telegram_url });
  if (data.instagram_url)  links.push({ id: nextId++, platform: "instagram",  label: "Instagram",          url: data.instagram_url });
  return links;
};

export default function ChatbotSettings() {
  const [form, setForm]               = useState(defaults);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [message, setMessage]         = useState("");

  // Modal state for add / edit
  const [showModal, setShowModal]     = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [linkForm, setLinkForm]       = useState({ platform: "messenger", label: "", url: "" });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/admin/chatbot/settings");
        const d = data?.data || {};
        setForm({
          enabled:  d.enabled ?? true,
          greeting: d.greeting || defaults.greeting,
          welcome:  d.welcome  || defaults.welcome,
        });
        setSocialLinks(parseSocialLinks(d));
      } catch {
        setForm(defaults);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const payload = {
        ...form,
        messenger_url: socialLinks.find((l) => l.platform === "messenger")?.url  || "",
        telegram_url:  socialLinks.find((l) => l.platform === "telegram")?.url   || "",
        instagram_url: socialLinks.find((l) => l.platform === "instagram")?.url  || "",
        social_links:  JSON.stringify(socialLinks),
      };
      const { data } = await api.put("/admin/chatbot/settings", payload);
      const d = data?.data || payload;
      setForm({ enabled: d.enabled ?? true, greeting: d.greeting || defaults.greeting, welcome: d.welcome || defaults.welcome });
      setSocialLinks(parseSocialLinks(d));
      setMessage("Saved successfully.");
      setTimeout(() => setMessage(""), 3000);
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  // ── Social link CRUD ──────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingLink(null);
    setLinkForm({ platform: "messenger", label: "", url: "" });
    setShowModal(true);
  };

  const openEdit = (link) => {
    setEditingLink(link);
    setLinkForm({ platform: link.platform, label: link.label, url: link.url });
    setShowModal(true);
  };

  const deleteLink = (id) => setSocialLinks((prev) => prev.filter((l) => l.id !== id));

  const saveLink = () => {
    const platform = PLATFORMS.find((p) => p.value === linkForm.platform) || PLATFORMS[PLATFORMS.length - 1];
    const label = linkForm.label.trim() || platform.label;
    if (!linkForm.url.trim()) return;
    if (editingLink) {
      setSocialLinks((prev) =>
        prev.map((l) => l.id === editingLink.id ? { ...l, platform: linkForm.platform, label, url: linkForm.url.trim() } : l)
      );
    } else {
      setSocialLinks((prev) => [...prev, { id: nextId++, platform: linkForm.platform, label, url: linkForm.url.trim() }]);
    }
    setShowModal(false);
  };

  const onPlatformChange = (value) => {
    const p = PLATFORMS.find((p) => p.value === value);
    setLinkForm((prev) => ({ ...prev, platform: value, label: p?.label || "" }));
  };

  if (loading) return <AdminContentSkeleton title="Chatbot Settings" />;

  const selectedPlatform = PLATFORMS.find((p) => p.value === linkForm.platform);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 md:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Chatbot Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage the customer support chatbot configuration.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* General Settings Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">General</h2>
            </div>
            <div className="p-6 space-y-5">

              {/* Enable toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800 dark:text-slate-100">Enable chatbot</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Show the floating chatbot widget.</p>
                </div>
                <button
                  type="button"
                  onClick={() => update("enabled", !form.enabled)}
                  className={"relative inline-flex h-6 w-11 items-center rounded-full transition-colors " + (form.enabled ? "bg-black dark:bg-emerald-600" : "bg-slate-300 dark:bg-slate-700")}
                >
                  <span className={"inline-block h-4 w-4 rounded-full bg-white dark:bg-slate-100 shadow-sm transition-transform " + (form.enabled ? "translate-x-6" : "translate-x-1")} />
                </button>
              </div>

              {/* Greeting */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Greeting</label>
                <input
                  value={form.greeting || ""}
                  onChange={(e) => update("greeting", e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>

              {/* Welcome message */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Welcome message</label>
                <textarea
                  value={form.welcome || ""}
                  onChange={(e) => update("welcome", e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-900 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Social Media Links Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-800 dark:text-slate-100">Social Media Links</h2>
              <button
                type="button"
                onClick={openAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add
              </button>
            </div>

            {socialLinks.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-300 text-sm">No social media links yet.</p>
                <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Click <strong>Add</strong> to connect your social media channels.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {socialLinks.map((link) => {
                  const platform = PLATFORMS.find((p) => p.value === link.platform);
                  return (
                    <div key={link.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                      <div className={"w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 " + (platform?.color || "bg-slate-500")}>
                        {PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.custom}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{link.label}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{link.url}</p>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => openEdit(link)}
                          className="h-9 w-9 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center justify-center"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteLink(link.id)}
                          title="Delete"
                          aria-label="Delete social link"
                          className="h-9 w-9 rounded-lg transition-colors inline-flex items-center justify-center"
                          style={{
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            backgroundColor: 'rgba(248,113,113,0.08)',
                          }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

          {/* Save bar */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-black text-white font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60 transition-colors"
            >
              {saving ? "Saving…" : "Save settings"}
            </button>
            {message && (
              <span className={"text-sm font-medium " + (message.startsWith("Saved") ? "text-emerald-600" : "text-red-500") }>
                {message}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* ── Add / Edit Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6">

            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingLink ? "Edit Social Media Link" : "Add Social Media Link"}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">

              {/* Platform grid selector */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Platform</label>
                <div className="grid grid-cols-3 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => onPlatformChange(p.value)}
                      className={"flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all " + (linkForm.platform === p.value
                        ? `${p.color} text-white border-transparent ring-2 ring-slate-300 dark:ring-slate-600`
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800")}
                    >
                      <span className={"w-7 h-7 rounded-lg flex items-center justify-center " + (linkForm.platform === p.value ? `${p.color} text-white ring-1 ring-white/50` : p.color + " text-white") }>
                        {PLATFORM_ICONS[p.value] || PLATFORM_ICONS.custom}
                      </span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Label <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={linkForm.label}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, label: e.target.value }))}
                  placeholder={selectedPlatform?.label || "Label"}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">URL</label>
                <input
                  type="url"
                  value={linkForm.url}
                  onChange={(e) => setLinkForm((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder={selectedPlatform?.placeholder || "https://..."}
                  className="w-full h-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-black dark:focus:border-white focus:bg-white dark:focus:bg-slate-900 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveLink}
                disabled={!linkForm.url.trim()}
                className="flex-1 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {editingLink ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
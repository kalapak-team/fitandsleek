import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import api from "../../lib/api";

const DEFAULTS = {
  enabled: true,
  greeting: "Hi there 👋",
  welcome: "How can we help you today?",
  social_links: [],
};

const PLATFORM_META = {
  messenger:  { label: "Facebook Messenger", color: "bg-[#1877F2]",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.892 1.44 5.476 3.696 7.17V22l3.378-1.858C10.053 20.37 11.011 20.5 12 20.5c5.523 0 10-4.145 10-9.257C22 6.145 17.523 2 12 2zm1.007 12.461-2.55-2.72-4.98 2.72 5.476-5.813 2.614 2.72 4.916-2.72-5.476 5.813z" /></svg> },
  telegram:   { label: "Telegram",            color: "bg-[#229ED9]",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.944 0A12 12 0 1024 12 12 12 0 0011.944 0zM8.531 16.75l-.352-3.703 8.885-8.027c.39-.348-.083-.514-.6-.197L6.088 12.5 2.44 11.388c-.837-.264-.85-.837.173-1.237L20.42 3.437c.7-.316 1.308.17 1.076 1.207L18.41 16.75c-.19.87-.73 1.08-1.477.675L13.7 15.01l-1.973 1.9c-.22.213-.4.39-.817.39z" /></svg> },
  instagram:  { label: "Instagram",           color: "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#515bd4]", icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162S8.597 18.163 12 18.163s6.162-2.759 6.162-6.162S15.403 5.838 12 5.838zm0 10.162c-2.209 0-4-1.79-4-4s1.791-4 4-4 4 1.791 4 4-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44 1.44-.644 1.44-1.44-.644-1.44-1.44-1.44z" /></svg> },
  whatsapp:   { label: "WhatsApp",            color: "bg-[#25D366]",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
  tiktok:     { label: "TikTok",              color: "bg-slate-900",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.18 8.18 0 004.77 1.52V6.92a4.85 4.85 0 01-1-.23z" /></svg> },
  youtube:    { label: "YouTube",             color: "bg-[#FF0000]",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
  twitter:    { label: "Twitter / X",         color: "bg-slate-800",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg> },
  line:       { label: "Line",                color: "bg-[#06C755]",   icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.630 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.630v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.630-.63.346 0 .628.285.628.630v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.630v4.141h1.756c.348 0 .629.283.629.630 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.070 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg> },
  custom:     { label: "Visit us",            color: "bg-slate-500",   icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
};


export default function SupportChatWidget() {
  const getMinBottomOffset = () => {
    if (typeof window === "undefined") return 100;
    return window.innerWidth >= 768 ? 154 : 196;
  };

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(DEFAULTS);
  const [pos, setPos] = useState(() => ({ right: 16, bottom: getMinBottomOffset() }));
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, right: 16, bottom: getMinBottomOffset() });
  const movedRef = useRef(false);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi there 👋 I’m FitandSleek support. How can I help today?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (buttonRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages, loading]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data } = await api.get("/chatbot/settings");
        setSettings({ ...DEFAULTS, ...(data?.data || {}) });
      } catch {
        setSettings(DEFAULTS);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const syncResponsiveBottomOffset = () => {
      const minBottom = getMinBottomOffset();
      setPos((prev) => ({
        ...prev,
        bottom: Math.max(prev.bottom, minBottom),
      }));
    };

    syncResponsiveBottomOffset();
    window.addEventListener("resize", syncResponsiveBottomOffset);
    return () => window.removeEventListener("resize", syncResponsiveBottomOffset);
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const history = next.slice(-8).map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const { data } = await api.post("/chatbot/message", {
        message: text,
        history,
      });
      const reply = data?.reply || "Sorry, I couldn’t generate a reply.";
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Sorry, the chat service is unavailable right now." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onPointerDown = (e) => {
    if (e.target && e.target.closest && e.target.closest('[data-drag-ignore="true"]')) return;
    draggingRef.current = true;
    movedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      right: pos.right,
      bottom: pos.bottom,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;

    const nextRight = Math.max(8, dragStartRef.current.right - dx);
    const nextBottom = Math.max(getMinBottomOffset(), dragStartRef.current.bottom - dy);
    setPos({ right: nextRight, bottom: nextBottom });
  };

  const onPointerUp = () => {
    draggingRef.current = false;
  };

  // Build contacts from social_links array; fall back to legacy flat fields
  const rawLinks = Array.isArray(settings.social_links) && settings.social_links.length > 0
    ? settings.social_links
    : [
        settings.messenger_url  ? { platform: "messenger",  url: settings.messenger_url }  : null,
        settings.telegram_url   ? { platform: "telegram",   url: settings.telegram_url }   : null,
        settings.instagram_url  ? { platform: "instagram",  url: settings.instagram_url }  : null,
      ].filter(Boolean);

  const contacts = rawLinks.map((l) => {
    const meta = PLATFORM_META[l.platform] || PLATFORM_META.custom;
    return {
      id:    l.id ?? l.platform,
      href:  l.url,
      label: l.label || meta.label,
      icon:  meta.icon,
      color: meta.color,
    };
  });

  if (!settings.enabled) return null;

  return (
    <div
      className="fixed z-[60] pointer-events-none flex flex-col items-end"
      style={{ right: pos.right, bottom: pos.bottom }}
    >
      <div
        ref={panelRef}
        className={`mb-3 w-[calc(100vw-2rem)] max-w-[360px] sm:max-w-[400px] rounded-3xl bg-white/95 shadow-2xl border border-zinc-200/70 overflow-hidden backdrop-blur transition-all duration-200 origin-bottom-right ${
          open
            ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
            : "pointer-events-none opacity-0 translate-y-2 scale-[0.98]"
        }`}
        aria-hidden={!open}
      >
        <div
          className="px-5 py-4 text-white bg-gradient-to-r from-[#5C7E64] via-[#6F8F72] to-[#93B895] cursor-move"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold tracking-wide">{settings.greeting || DEFAULTS.greeting}</p>
              <p className="mt-1 text-xs text-white/90">{settings.welcome || DEFAULTS.welcome}</p>
            </div>
            <button
              type="button"
              data-drag-ignore="true"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
              }}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 transition"
              aria-label="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div ref={listRef} className="max-h-64 overflow-y-auto pr-1 space-y-3">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[85%] ${
                    m.role === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-zinc-100 text-zinc-900"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-2xl text-sm bg-zinc-100 text-zinc-500">Typing…</div>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-full px-2 py-1">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Ask about orders, shipping, size…"
              className="flex-1 h-9 bg-transparent px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="h-9 px-4 rounded-full bg-zinc-900 text-white text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>

          {contacts.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-2">
              {contacts.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-xl border border-zinc-200/70 px-3 py-2.5 hover:shadow-sm hover:-translate-y-0.5 transition-all"
                >
                  <span className={"h-9 w-9 rounded-full text-white flex items-center justify-center " + item.color}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">{item.label}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {!open && (
        <button
          ref={buttonRef}
          type="button"
          onClick={() => {
            if (movedRef.current) return;
            setOpen(true);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="relative pointer-events-auto h-14 w-14 rounded-full bg-zinc-900 text-white shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
          aria-label="Open support chat"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
        </button>
      )}
    </div>
  );
}
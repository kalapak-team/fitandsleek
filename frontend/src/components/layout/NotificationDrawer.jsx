import React from "react";
import { resolveImageUrl } from "../../lib/images";

export default function NotificationDrawer({
  open,
  onClose,
  notifications = [],
  loading = false,
  unreadCount = 0,
  onMarkRead = () => {},
  onMarkAllRead = () => {},
  user = null,
  formatTime = () => "",
}) {
  const inferMediaType = (url, fallback = "") => {
    if (fallback) return fallback;
    if (!url) return "";
    const lower = url.toLowerCase();
    if (lower.startsWith("data:video")) return "video";
    if (lower.startsWith("data:image")) return "image";
    if (lower.match(/\.(mp4|webm|ogg)(\?|#|$)/)) return "video";
    if (lower.match(/\.(jpg|jpeg|png|webp|gif|svg)(\?|#|$)/)) return "image";
    return "";
  };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-soft flex flex-col">
        <div className="h-16 px-5 border-b border-zinc-200 flex items-center justify-between">
          <div className="font-black">Notifications</div>
          <div className="flex items-center gap-2">
            {user && unreadCount > 0 ? (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-emerald-600 hover:text-emerald-700"
              >
                Mark all read
              </button>
            ) : null}
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full border border-zinc-200 hover:bg-zinc-50"
            >
              <svg className="w-5 h-5 mx-auto" viewBox="0 0 24 24" fill="none">
                <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="text-sm text-zinc-600">Loading…</div>
          ) : notifications.length === 0 ? (
            <div className="text-sm text-zinc-600">No notifications</div>
          ) : (
            <div className="grid gap-3">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onMarkRead(item)}
                  className={`text-left p-4 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition ${
                    item.is_read ? "opacity-70" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${item.is_read ? "bg-zinc-300" : "bg-emerald-500"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {item.title || "Notification"}
                      </p>
                      {item.media_url ? (
                        inferMediaType(item.media_url, item.media_type) === "video" ? (
                          <video
                            className="mt-2 w-full rounded-lg border border-zinc-200"
                            src={item.media_url.startsWith("http") ? item.media_url : resolveImageUrl(item.media_url)}
                            controls
                          />
                        ) : (
                          <img
                            className="mt-2 w-full rounded-lg border border-zinc-200 object-cover"
                            src={item.media_url.startsWith("http") ? item.media_url : resolveImageUrl(item.media_url)}
                            alt={item.title || "Notification"}
                          />
                        )
                      ) : null}
                      <p className="text-xs text-zinc-600 line-clamp-3 mt-1">{item.message}</p>
                      {item.link_url ? (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                        >
                          Open link
                        </a>
                      ) : null}
                      <p className="text-[11px] text-zinc-400 mt-2">
                        {formatTime ? formatTime(item.created_at) : ""}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

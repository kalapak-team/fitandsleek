import React from "react";
import { useHomepageSettings } from "../../state/homepageSettings.jsx";

export default function Topbar() {
  const { settings } = useHomepageSettings();
  const headerSettings = settings?.header || {};
  const icon = headerSettings.free_delivery_icon || "🚚";
  const message = headerSettings.free_delivery_text || "Free delivery on order above $40 spent";

  return (
    <div className="border-b border-zinc-200 bg-white">
      <div className="container-safe h-9 flex items-center justify-center text-xs text-zinc-700">
        <span className="animate-pulse mr-2">{icon}</span>
        {message}
      </div>
    </div>
  );
}

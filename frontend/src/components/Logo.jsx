import React from "react";
import { resolveImageUrl } from "../lib/images";

export default function Logo({ className = "h-12 w-auto", src = "/logo.png", alt = "Fitandsleek" }) {
  const fallbackSrc = resolveImageUrl("/logo.png");
  const resolvedSrc = resolveImageUrl(src || "/logo.png");

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={`${className} object-contain`}
      onError={(e) => {
        if (e.currentTarget.src !== fallbackSrc) {
          e.currentTarget.src = fallbackSrc;
        }
      }}
    />
  );
}

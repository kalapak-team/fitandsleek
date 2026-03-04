import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const WishlistCtx = createContext(null);
const KEY = "fs_wishlist_v1";

function safeRead() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);

  useEffect(() => {
    setIds(safeRead());
  }, []);

  const toggle = (productId) => {
    setIds((prev) => {
      const next = prev.includes(productId) ? prev.filter((x) => x !== productId) : [...prev, productId];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const value = useMemo(
    () => ({ ids, count: ids.length, has: (id) => ids.includes(id), toggle }),
    [ids]
  );

  return <WishlistCtx.Provider value={value}>{children}</WishlistCtx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistCtx);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";
import { useAuth } from "./auth";

const CartCtx = createContext(null);
const LOCAL_CART_KEY = "fs_guest_cart";

const readLocalCart = () => {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY);
    const items = raw ? JSON.parse(raw) : [];
    const safeItems = Array.isArray(items) ? items : [];
    const total = safeItems.reduce(
      (sum, it) => sum + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0),
      0
    );
    return { items: safeItems, total };
  } catch {
    return { items: [], total: 0 };
  }
};

const writeLocalCart = (items) => {
  const safeItems = Array.isArray(items) ? items : [];
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(safeItems));
  const total = safeItems.reduce(
    (sum, it) => sum + (Number(it.unit_price) || 0) * (Number(it.quantity) || 0),
    0
  );
  return { items: safeItems, total };
};

export function CartProvider({ children }) {
  const { user, booted, token } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    // Don't try to load cart if not logged in or no token
    if (!user || !token) {
      const local = readLocalCart();
      setCart({ items: local.items });
      setTotal(local.total);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/cart");
      setCart(data.cart);
      setTotal(data.total);
    } catch (err) {
      console.error("Cart load error:", err);
      // If 401 or 403, the token might be invalid - don't clear, just log
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Authentication required");
      } else {
        setError(err.response?.data?.message || "Failed to load cart");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth to boot and user to be logged in
    if (!booted) return;
    if (!user || !token) {
      const local = readLocalCart();
      setCart({ items: local.items });
      setTotal(local.total);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booted, user?.id, token]);

  const add = async (productOrId, quantity = 1, size = null, color = null) => {
    if (!user || !token) {
      const product = typeof productOrId === "object" ? productOrId : null;
      if (!product?.id) throw new Error("PRODUCT_REQUIRED");

      const unitPrice =
        product.discount?.sale_price ?? product.activeSale?.sale_price ?? product.price ?? 0;

      const current = readLocalCart().items;
      const maxStock = Number.isFinite(Number(product?.stock)) ? Number(product.stock) : null;
      const variantKey = `${product.id}::${size || ""}::${color || ""}`;
      const existing = current.find((it) => it.id === variantKey);
      const totalForProduct = current
        .filter((it) => it.product?.id === product.id)
        .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
      if (maxStock !== null && totalForProduct + quantity > maxStock) {
        setError("Stock limit reached for this product.");
        throw new Error("STOCK_LIMIT");
      }
      let next = [];
      if (existing) {
        next = current.map((it) =>
          it.id === variantKey
            ? { ...it, quantity: (Number(it.quantity) || 0) + quantity }
            : it
        );
      } else {
        next = [
          ...current,
          {
            id: variantKey,
            product,
            color: color || null,
            size: size || null,
            unit_price: Number(unitPrice) || 0,
            quantity,
          },
        ];
      }
      const local = writeLocalCart(next);
      setCart({ items: local.items });
      setTotal(local.total);
      return { cart: { items: local.items }, total: local.total };
    }

    setError(null);
    try {
      const productId = typeof productOrId === "object" ? productOrId.id : productOrId;
      const { data } = await api.post("/cart/items", { product_id: productId, quantity, size: size || null, color: color || null });
      setCart(data.cart);
      setTotal(data.total);
      return data;
    } catch (err) {
      console.error("Add to cart error:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        throw new Error("LOGIN_REQUIRED");
      }
      throw new Error(err.response?.data?.message || "Failed to add to cart");
    }
  };

  const updateQty = async (itemId, quantity) => {
    if (!user || !token) {
      const current = readLocalCart().items;
      const item = current.find((it) => it.id === itemId);
      const maxStock = Number.isFinite(Number(item?.product?.stock)) ? Number(item.product.stock) : null;
      if (maxStock !== null) {
        const otherQty = current
          .filter((it) => it.product?.id === item?.product?.id && it.id !== itemId)
          .reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
        if (otherQty + quantity > maxStock) {
          setError("Stock limit reached for this product.");
          quantity = Math.max(1, maxStock - otherQty);
        }
      }
      const next = current
        .map((it) => (it.id === itemId ? { ...it, quantity } : it))
        .filter((it) => (Number(it.quantity) || 0) > 0);
      const local = writeLocalCart(next);
      setCart({ items: local.items });
      setTotal(local.total);
      return { cart: { items: local.items }, total: local.total };
    }

    setError(null);
    try {
      const { data } = await api.patch(`/cart/items/${itemId}`, { quantity });
      setCart(data.cart);
      setTotal(data.total);
      return data;
    } catch (err) {
      console.error("Update quantity error:", err);
      throw new Error(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const remove = async (itemId) => {
    if (!user || !token) {
      const current = readLocalCart().items;
      const next = current.filter((it) => it.id !== itemId);
      const local = writeLocalCart(next);
      setCart({ items: local.items });
      setTotal(local.total);
      return { cart: { items: local.items }, total: local.total };
    }

    setError(null);
    try {
      const { data } = await api.delete(`/cart/items/${itemId}`);
      setCart(data.cart);
      setTotal(data.total);
      return data;
    } catch (err) {
      console.error("Remove item error:", err);
      throw new Error(err.response?.data?.message || "Failed to remove item");
    }
  };

  const clearError = () => setError(null);

  const count = cart?.items?.reduce((s, i) => s + (i.quantity || 0), 0) || 0;

  const value = useMemo(
    () => ({ cart, total, loading, count, error, load, add, updateQty, remove, clearError }),
    [cart, total, loading, count, error]
  );

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

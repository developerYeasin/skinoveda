import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { trackEvent } from '../api/tracking';

const KEY = 'skv_cart';
const CartContext = createContext(null);

/** Cart lives in localStorage so a refresh never loses the bag. */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* storage can be blocked */ }
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    setItems((list) => {
      const existing = list.find((i) => i.product_id === product.id);
      if (existing) {
        return list.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: Math.min(i.quantity + quantity, 99) }
            : i
        );
      }
      return [
        ...list,
        {
          product_id: product.id,
          name: product.name,
          name_bn: product.name_bn,
          slug: product.slug,
          image: product.image,
          price: Number(product.effective_price ?? product.sale_price ?? product.price),
          quantity: Math.min(quantity, 99),
        },
      ];
    });
    trackEvent('add_to_cart', { label: product.name, value: Number(product.effective_price ?? product.price) });
    setOpen(true);
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((list) =>
      quantity <= 0
        ? list.filter((i) => i.product_id !== productId)
        : list.map((i) => (i.product_id === productId ? { ...i, quantity: Math.min(quantity, 99) } : i))
    );
  }, []);

  const remove = useCallback((productId) => {
    setItems((list) => list.filter((i) => i.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((n, i) => n + i.price * i.quantity, 0);
    return {
      items, count, subtotal,
      add, setQuantity, remove, clear,
      open, setOpen,
      has: (id) => items.some((i) => i.product_id === id),
    };
  }, [items, add, setQuantity, remove, clear, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}

/* ---------- wishlist (local only) ---------- */

const WKEY = 'skv_wishlist';

export function useWishlist() {
  const [ids, setIds] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WKEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  const toggle = useCallback((id) => {
    setIds((list) => {
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      try { localStorage.setItem(WKEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  return { ids, toggle, has: (id) => ids.includes(id) };
}

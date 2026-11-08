'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  type Cart,
  createCartClient,
  getCart,
  createCart,
  addCartLine,
  updateCartLine,
  removeCartLine,
} from '@/lib/shopify-cart';

// What an add actually did, for the button to report. `limited` means Shopify
// had less stock than requested: `added` went in this time (possibly 0) and
// `inCart` is now the most the shopper can have.
export type AddToCartOutcome =
  | { status: 'added' }
  | { status: 'sold-out' }
  | { status: 'limited'; added: number; inCart: number };

type CartContextType = {
  cart: Cart | null;
  itemCount: number;
  loading: boolean;
  addToCart: (merchandiseId: string, quantity: number) => Promise<AddToCartOutcome>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  checkoutUrl: string | null;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({
  children,
  storeDomain,
  storefrontToken,
}: {
  children: ReactNode;
  storeDomain: string;
  storefrontToken: string;
}) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const client = useMemo(() => createCartClient(storeDomain, storefrontToken), [storeDomain, storefrontToken]);

  useEffect(() => {
    const cartId = localStorage.getItem('shopify_cart_id');
    if (cartId) {
      getCart(client, cartId)
        .then((c) => {
          if (c) setCart(c);
          else localStorage.removeItem('shopify_cart_id');
        })
        // A network or API error isn't proof the cart is gone, so keep the id
        // and try again on the next page load.
        .catch(() => {});
    }
  }, [client]);

  const addToCart = useCallback(async (merchandiseId: string, quantity: number): Promise<AddToCartOutcome> => {
    setLoading(true);
    try {
      const quantityOf = (c: Cart | null) =>
        c?.lines.find((line) => line.merchandise.id === merchandiseId)?.quantity ?? 0;
      const before = quantityOf(cart);

      const cartId = localStorage.getItem('shopify_cart_id');
      const { cart: updated, soldOut } = cartId
        ? await addCartLine(client, cartId, merchandiseId, quantity)
        : await createCart(client, merchandiseId, quantity);
      if (!cartId) localStorage.setItem('shopify_cart_id', updated.id);
      setCart(updated);

      if (soldOut) return { status: 'sold-out' };
      const inCart = quantityOf(updated);
      const added = inCart - before;
      return added >= quantity ? { status: 'added' } : { status: 'limited', added, inCart };
    } finally {
      setLoading(false);
    }
  }, [client, cart]);

  const updateQuantity = useCallback(async (lineId: string, quantity: number) => {
    if (!cart) return;
    setLoading(true);
    try {
      const updated = await updateCartLine(client, cart.id, lineId, quantity);
      setCart(updated);
    } finally {
      setLoading(false);
    }
  }, [client, cart]);

  const removeItem = useCallback(async (lineId: string) => {
    if (!cart) return;
    setLoading(true);
    try {
      const updated = await removeCartLine(client, cart.id, lineId);
      setCart(updated);
    } finally {
      setLoading(false);
    }
  }, [client, cart]);

  const itemCount = cart?.lines.reduce((sum, line) => sum + line.quantity, 0) ?? 0;

  return (
    <CartContext.Provider value={{
      cart,
      itemCount,
      loading,
      addToCart,
      updateQuantity,
      removeItem,
      checkoutUrl: cart?.checkoutUrl ?? null,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

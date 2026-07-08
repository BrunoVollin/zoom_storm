"use client";

import { useCallback, useEffect, useState } from "react";

export const CART_ID_STORAGE_KEY = "zoom-storm:cart-id";
const STORAGE_KEY = CART_ID_STORAGE_KEY;

/**
 * Persists the active cart id in `localStorage` so the same cart survives
 * reloads. The cart-service has no "get cart for user" lookup, so the id
 * itself is the only handle the frontend has to its cart.
 */
export function useCartId(): [string | null, (cartId: string) => void] {
  const [cartId, setCartIdState] = useState<string | null>(null);

  useEffect(() => {
    setCartIdState(window.localStorage.getItem(STORAGE_KEY));
  }, []);

  const setCartId = useCallback((next: string) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setCartIdState(next);
  }, []);

  return [cartId, setCartId];
}

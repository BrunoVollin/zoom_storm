"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "zoom-storm:cart-id";

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

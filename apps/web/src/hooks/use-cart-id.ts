"use client";

import { useCallback, useSyncExternalStore } from "react";

export const CART_ID_STORAGE_KEY = "zoom-storm:cart-id";
const STORAGE_KEY = CART_ID_STORAGE_KEY;

const listeners = new Set<() => void>();

function readCartId(): string | null {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot(): string | null {
  return null;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

export function clearCartId(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  emitChange();
}

/**
 * Persists the active cart id in `localStorage` so the same cart survives
 * reloads. The cart-service has no "get cart for user" lookup, so the id
 * itself is the only handle the frontend has to its cart.
 *
 * Every `useCart()` caller (product cards, the header badge, the cart page)
 * mounts its own instance of this hook. Reading/writing plain `useState`
 * per-instance let each one drift out of sync with the others, so a click on
 * one product card could create a brand new cart while another instance
 * still pointed at the previous one. `useSyncExternalStore` keeps every
 * instance subscribed to the same value instead.
 */
export function useCartId(): [string | null, (cartId: string) => void] {
  const cartId = useSyncExternalStore(subscribe, readCartId, getServerSnapshot);

  const setCartId = useCallback((next: string) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    emitChange();
  }, []);

  return [cartId, setCartId];
}

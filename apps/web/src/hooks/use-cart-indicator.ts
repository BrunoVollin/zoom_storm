"use client";

import { useSyncExternalStore } from "react";

const STORAGE_PREFIX = "zoom-storm:cart-indicator-seen:";

const listeners = new Set<() => void>();

function storageKey(cartId: string): string {
  return `${STORAGE_PREFIX}${cartId}`;
}

function readSeenCount(cartId: string): number {
  const raw = window.localStorage.getItem(storageKey(cartId));
  const parsed = raw ? Number(raw) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

function getServerSnapshot(): number {
  return 0;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emitChange() {
  listeners.forEach((listener) => listener());
}

/**
 * Marks the cart's current item count as "seen" — called when the cart page
 * mounts, so the header badge stops counting items the user has already
 * looked at.
 */
export function markCartIndicatorSeen(cartId: string, itemCount: number): void {
  window.localStorage.setItem(storageKey(cartId), String(itemCount));
  emitChange();
}

/**
 * Tracks how many cart items haven't been "seen" yet (i.e. added since the
 * user last opened the cart page), for the badge on the header's cart icon.
 *
 * Backed by `localStorage` + `useSyncExternalStore` so every mounted
 * instance (header badge, cart page) stays in sync, mirroring `useCartId`.
 */
export function useCartIndicatorCount(cartId: string | undefined, itemCount: number): number {
  const seenCount = useSyncExternalStore(
    subscribe,
    () => (cartId ? readSeenCount(cartId) : 0),
    getServerSnapshot,
  );

  return Math.max(itemCount - seenCount, 0);
}

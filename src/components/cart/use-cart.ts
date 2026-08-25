"use client";

import { useSyncExternalStore } from "react";
import { CART_CHANGE_EVENT, cartCount, readCart } from "@/lib/cart";
import type { CartItem } from "@/lib/cart";

const EMPTY: CartItem[] = [];
const cache = new Map<string, CartItem[]>();

function getSnapshot(tenantId: string): CartItem[] {
  const cached = cache.get(tenantId);
  if (cached !== undefined) return cached;
  const items = readCart(tenantId);
  cache.set(tenantId, items);
  return items;
}

function subscribe(callback: () => void) {
  const onEvent = () => {
    cache.clear();
    callback();
  };
  window.addEventListener("storage", onEvent);
  window.addEventListener("focus", onEvent);
  window.addEventListener("pageshow", onEvent);
  window.addEventListener(CART_CHANGE_EVENT, onEvent);
  return () => {
    window.removeEventListener("storage", onEvent);
    window.removeEventListener("focus", onEvent);
    window.removeEventListener("pageshow", onEvent);
    window.removeEventListener(CART_CHANGE_EVENT, onEvent);
  };
}

export function useCart(tenantId: string): CartItem[] {
  return useSyncExternalStore(subscribe, () => getSnapshot(tenantId), () => EMPTY);
}

export function useCartCount(tenantId: string): number {
  return cartCount(useCart(tenantId));
}

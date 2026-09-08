"use client";

import { syncWishlist } from "@/app/(storefront)/[subdomain]/wishlist/actions";

const key = (tenantId: string) => `venfii:wishlist:${tenantId}`;

const cache = new Map<string, string[]>();
const listeners = new Map<string, Set<() => void>>();

let customerEmail: string | null = null;
let customerChecked = false;
const syncedTenants = new Set<string>();

function readFromStorage(tenantId: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(tenantId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function getCached(tenantId: string): string[] {
  let list = cache.get(tenantId);
  if (!list) {
    list = readFromStorage(tenantId);
    cache.set(tenantId, list);
  }
  return list;
}

function emit(tenantId: string) {
  listeners.get(tenantId)?.forEach((fn) => fn());
}

export function getWishlist(tenantId: string): string[] {
  return getCached(tenantId);
}

export function isWishlisted(tenantId: string, productId: string): boolean {
  return getCached(tenantId).includes(productId);
}

export function toggleWishlistItem(
  tenantId: string,
  productId: string
): string[] {
  const current = getCached(tenantId);
  const next = current.includes(productId)
    ? current.filter((id) => id !== productId)
    : [...current, productId];
  cache.set(tenantId, next);
  try {
    window.localStorage.setItem(key(tenantId), JSON.stringify(next));
  } catch {
    // storage unavailable (private mode, quota); keep in-memory state
  }
  emit(tenantId);
  return next;
}

export function subscribeWishlist(
  tenantId: string,
  callback: () => void
): () => void {
  let set = listeners.get(tenantId);
  if (!set) {
    set = new Set();
    listeners.set(tenantId, set);
  }
  set.add(callback);
  return () => {
    set?.delete(callback);
  };
}

export function getWishlistCustomerEmail(): string | null {
  return customerChecked ? customerEmail : null;
}

export function setWishlistCustomerEmail(email: string | null): void {
  customerEmail = email;
  customerChecked = true;
}

export function mergeWishlist(tenantId: string, serverIds: string[]): void {
  const current = getCached(tenantId);
  const merged = [...new Set([...serverIds, ...current])];
  cache.set(tenantId, merged);
  try {
    window.localStorage.setItem(key(tenantId), JSON.stringify(merged));
  } catch {
    // storage unavailable (private mode, quota); keep in-memory state
  }
  emit(tenantId);
}

export function ensureWishlistSynced(tenantId: string): void {
  if (syncedTenants.has(tenantId)) return;
  syncedTenants.add(tenantId);
  void (async () => {
    try {
      const result = await syncWishlist(tenantId, getWishlist(tenantId));
      setWishlistCustomerEmail(result.email);
      if (result.email) mergeWishlist(tenantId, result.ids);
    } catch {
      syncedTenants.delete(tenantId);
    }
  })();
}

export type CartItem = {
  productId: string;
  variantId?: string;
  slug: string;
  name: string;
  priceMinor: number;
  currency: string;
  image: string | null;
  quantity: number;
};

export function cartKey(tenantId: string): string {
  return `venfii-cart-${tenantId}`;
}

export function readCart(tenantId: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const items = JSON.parse(localStorage.getItem(cartKey(tenantId)) ?? "[]");
    return Array.isArray(items) ? (items as CartItem[]) : [];
  } catch {
    return [];
  }
}

export const CART_CHANGE_EVENT = "venfii-cart-change";

export function writeCart(tenantId: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(cartKey(tenantId), JSON.stringify(items));
  window.dispatchEvent(new Event(CART_CHANGE_EVENT));
}

export function cartTotalMinor(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceMinor * item.quantity, 0);
}

export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

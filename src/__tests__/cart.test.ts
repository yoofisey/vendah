import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  cartKey,
  readCart,
  writeCart,
  cartTotalMinor,
  cartCount,
  type CartItem,
} from "@/lib/cart";

const TENANT_ID = "test-tenant-123";

const mockItem: CartItem = {
  productId: "prod-1",
  slug: "nice-shirt",
  name: "Nice Shirt",
  priceMinor: 5000,
  currency: "GHS",
  image: null,
  quantity: 2,
};

const mockItem2: CartItem = {
  productId: "prod-2",
  slug: "cool-hat",
  name: "Cool Hat",
  priceMinor: 3000,
  currency: "GHS",
  image: null,
  quantity: 1,
};

describe("cartKey", () => {
  it("returns a key with the tenant id", () => {
    expect(cartKey(TENANT_ID)).toBe("venfii-cart-test-tenant-123");
  });
});

describe("readCart / writeCart", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns empty array when nothing stored", () => {
    expect(readCart(TENANT_ID)).toEqual([]);
  });

  it("writes and reads back items", () => {
    writeCart(TENANT_ID, [mockItem]);
    expect(readCart(TENANT_ID)).toEqual([mockItem]);
  });

  it("overwrites previous cart on write", () => {
    writeCart(TENANT_ID, [mockItem]);
    writeCart(TENANT_ID, [mockItem2]);
    expect(readCart(TENANT_ID)).toEqual([mockItem2]);
  });

  it("returns empty array for corrupted data", () => {
    localStorage.setItem(cartKey(TENANT_ID), "not-json");
    expect(readCart(TENANT_ID)).toEqual([]);
  });

  it("returns empty array for non-array data", () => {
    localStorage.setItem(cartKey(TENANT_ID), JSON.stringify({ foo: "bar" }));
    expect(readCart(TENANT_ID)).toEqual([]);
  });

  it("dispatches CART_CHANGE_EVENT on write", () => {
    const spy = vi.fn();
    window.addEventListener("venfii-cart-change", spy);
    writeCart(TENANT_ID, [mockItem]);
    expect(spy).toHaveBeenCalledTimes(1);
    window.removeEventListener("venfii-cart-change", spy);
  });
});

describe("cartTotalMinor", () => {
  it("sums priceMinor * quantity for all items", () => {
    expect(cartTotalMinor([mockItem, mockItem2])).toBe(13000);
  });

  it("returns 0 for empty cart", () => {
    expect(cartTotalMinor([])).toBe(0);
  });

  it("handles single item", () => {
    expect(cartTotalMinor([mockItem])).toBe(10000);
  });
});

describe("cartCount", () => {
  it("sums quantities", () => {
    expect(cartCount([mockItem, mockItem2])).toBe(3);
  });

  it("returns 0 for empty cart", () => {
    expect(cartCount([])).toBe(0);
  });
});

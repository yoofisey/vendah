import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isPathBasedStorefront, resolveStorefrontHref } from "@/lib/storefront-href";

const previousFlag = process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED;

beforeEach(() => {
  process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED = "true";
});

afterEach(() => {
  if (previousFlag === undefined) {
    delete process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED;
  } else {
    process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED = previousFlag;
  }
});

describe("isPathBasedStorefront", () => {
  it("is true when the flag is true", () => {
    process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED = "true";
    expect(isPathBasedStorefront()).toBe(true);
  });

  it("is false when unset", () => {
    delete process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED;
    expect(isPathBasedStorefront()).toBe(false);
  });
});

describe("resolveStorefrontHref", () => {
  it("prefixes internal paths with the subdomain in path-based mode", () => {
    expect(resolveStorefrontHref("mensfit", "/shop")).toBe("/mensfit/shop");
    expect(resolveStorefrontHref("mensfit", "/")).toBe("/mensfit");
    expect(resolveStorefrontHref("mensfit", "/products/tee")).toBe(
      "/mensfit/products/tee"
    );
  });

  it("keeps query strings intact", () => {
    expect(
      resolveStorefrontHref("mensfit", "/track?ref=VH-ABC")
    ).toBe("/mensfit/track?ref=VH-ABC");
  });

  it("does not double-prefix an already-prefixed href", () => {
    expect(resolveStorefrontHref("mensfit", "/mensfit/shop")).toBe(
      "/mensfit/shop"
    );
  });

  it("returns the href unchanged when not in path-based mode", () => {
    delete process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED;
    expect(resolveStorefrontHref("mensfit", "/shop")).toBe("/shop");
  });

  it("returns the href unchanged without a subdomain", () => {
    expect(resolveStorefrontHref(null, "/shop")).toBe("/shop");
    expect(resolveStorefrontHref("", "/shop")).toBe("/shop");
  });

  it("leaves absolute URLs, external schemes and anchors alone", () => {
    expect(resolveStorefrontHref("mensfit", "https://x.com/y")).toBe(
      "https://x.com/y"
    );
    expect(resolveStorefrontHref("mensfit", "#reviews")).toBe("#reviews");
  });

  it("leaves API routes alone", () => {
    expect(resolveStorefrontHref("mensfit", "/api/auth/callback")).toBe(
      "/api/auth/callback"
    );
  });
});
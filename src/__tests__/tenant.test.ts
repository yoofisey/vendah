import { describe, it, expect } from "vitest";
import {
  slugify,
  normalizeSubdomain,
  isValidSubdomain,
  RESERVED_SUBDOMAINS,
  getStorefrontUrl,
  getDashboardUrl,
} from "@/lib/tenant";

describe("slugify", () => {
  it("lowercases and trims", () => {
    expect(slugify("  Hello World  ")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Ama's Boutique!")).toBe("amas-boutique");
  });

  it("collapses underscores and spaces into hyphens", () => {
    expect(slugify("my cool shop")).toBe("my-cool-shop");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("--hello--")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long)).toHaveLength(60);
  });

  it("returns empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });

  it("handles numbers", () => {
    expect(slugify("Shop 123")).toBe("shop-123");
  });
});

describe("normalizeSubdomain", () => {
  it("lowercases and replaces invalid chars with hyphens", () => {
    expect(normalizeSubdomain("My Shop!")).toBe("my-shop");
  });

  it("collapses multiple hyphens", () => {
    expect(normalizeSubdomain("a---b")).toBe("a-b");
  });

  it("strips leading and trailing hyphens", () => {
    expect(normalizeSubdomain("-hello-")).toBe("hello");
  });

  it("allows numbers and hyphens", () => {
    expect(normalizeSubdomain("shop-123")).toBe("shop-123");
  });
});

describe("isValidSubdomain", () => {
  it("accepts valid subdomains", () => {
    expect(isValidSubdomain("myshop")).toBe(true);
    expect(isValidSubdomain("shop-123")).toBe(true);
    expect(isValidSubdomain("a")).toBe(true);
    expect(isValidSubdomain("abc123")).toBe(true);
  });

  it("rejects subdomains with invalid chars", () => {
    expect(isValidSubdomain("my shop")).toBe(false);
    expect(isValidSubdomain("my_shop")).toBe(false);
    expect(isValidSubdomain("my.shop")).toBe(false);
  });

  it("rejects subdomains starting or ending with hyphen", () => {
    expect(isValidSubdomain("-shop")).toBe(false);
    expect(isValidSubdomain("shop-")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidSubdomain("")).toBe(false);
  });
});

describe("RESERVED_SUBDOMAINS", () => {
  it("contains expected reserved words", () => {
    expect(RESERVED_SUBDOMAINS.has("www")).toBe(true);
    expect(RESERVED_SUBDOMAINS.has("admin")).toBe(true);
    expect(RESERVED_SUBDOMAINS.has("api")).toBe(true);
    expect(RESERVED_SUBDOMAINS.has("dashboard")).toBe(true);
    expect(RESERVED_SUBDOMAINS.has("venfii")).toBe(true);
  });

  it("does not reserve normal shop names", () => {
    expect(RESERVED_SUBDOMAINS.has("ama-boutique")).toBe(false);
    expect(RESERVED_SUBDOMAINS.has("kofi-electronics")).toBe(false);
  });
});

describe("getStorefrontUrl", () => {
  it("builds URL with subdomain", () => {
    expect(getStorefrontUrl("myshop")).toBe("https://myshop.venfii.com");
  });
});

describe("getDashboardUrl", () => {
  it("builds base URL", () => {
    expect(getDashboardUrl()).toBe("https://venfii.com/");
  });

  it("appends path with leading slash", () => {
    expect(getDashboardUrl("/orders")).toBe("https://venfii.com/orders");
  });

  it("adds slash to path without leading slash", () => {
    expect(getDashboardUrl("orders")).toBe("https://venfii.com/orders");
  });
});

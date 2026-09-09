import { describe, it, expect } from "vitest";
import {
  applyProductAttributeFilters,
  ATTR_PARAM_PREFIX,
  buildProductFilterDefs,
  filterProductsByPrice,
  parseAttributeFilters,
  parsePriceParam,
} from "@/lib/storefront-filters";
import type { Product } from "@/lib/types";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: "p-1",
    tenant_id: "t-1",
    name: "Product",
    slug: "product",
    description: null,
    price_minor: 10000,
    currency: "GHS",
    stock: 10,
    sku: null,
    weight_grams: null,
    images: [],
    image_alts: [],
    attributes: {},
    category_id: null,
    featured: false,
    status: "active",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("parseAttributeFilters", () => {
  it("extracts attr_ prefixed params into a plain record", () => {
    const result = parseAttributeFilters({
      sort: "price-asc",
      min_price: "10",
      [`${ATTR_PARAM_PREFIX}size`]: "M",
      [`${ATTR_PARAM_PREFIX}color`]: "Red",
    });
    expect(result).toEqual({ size: "M", color: "Red" });
  });

  it("ignores empty and array values it cannot use", () => {
    const result = parseAttributeFilters({
      [`${ATTR_PARAM_PREFIX}size`]: "",
      [`${ATTR_PARAM_PREFIX}color`]: ["Red", "Blue"],
      [`${ATTR_PARAM_PREFIX}material`]: undefined,
    });
    expect(result).toEqual({ color: "Red" });
  });

  it("returns an empty record when no attribute params exist", () => {
    expect(parseAttributeFilters({ sort: "newest" })).toEqual({});
  });
});

describe("parsePriceParam", () => {
  it("parses valid prices", () => {
    expect(parsePriceParam("150")).toBe(150);
    expect(parsePriceParam("0")).toBe(0);
  });

  it("normalizes array values", () => {
    expect(parsePriceParam(["200", "300"])).toBe(200);
  });

  it("returns undefined for missing, empty, negative or invalid values", () => {
    expect(parsePriceParam(undefined)).toBeUndefined();
    expect(parsePriceParam("")).toBeUndefined();
    expect(parsePriceParam("-5")).toBeUndefined();
    expect(parsePriceParam("abc")).toBeUndefined();
  });
});

describe("buildProductFilterDefs", () => {
  it("collects distinct values with counts from product attributes", () => {
    const products = [
      makeProduct({ attributes: { size: "S", color: "Red" } }),
      makeProduct({ attributes: { size: "M", color: "Red" } }),
      makeProduct({ attributes: { size: "M", color: "Blue" } }),
      makeProduct({ attributes: {} }),
    ];
    const defs = [
      { key: "size", label: "Size", type: "select" as const },
      { key: "color", label: "Colour", type: "select" as const },
    ];
    const result = buildProductFilterDefs(products, defs);
    expect(result).toEqual([
      {
        key: "size",
        label: "Size",
        values: [
          { value: "M", count: 2 },
          { value: "S", count: 1 },
        ],
      },
      {
        key: "color",
        label: "Colour",
        values: [
          { value: "Red", count: 2 },
          { value: "Blue", count: 1 },
        ],
      },
    ]);
  });

  it("skips attributes with no values on any product", () => {
    const result = buildProductFilterDefs(
      [makeProduct({ attributes: {} })],
      [{ key: "size", label: "Size", type: "select" }]
    );
    expect(result).toEqual([]);
  });

  it("skips text attributes with too many distinct values", () => {
    const products = Array.from({ length: 12 }, (_, i) =>
      makeProduct({ attributes: { serial: `SN-${i}` } })
    );
    const result = buildProductFilterDefs(
      products,
      [{ key: "serial", label: "Serial", type: "text" }]
    );
    expect(result).toEqual([]);
  });

  it("shows select attributes regardless of distinct value count", () => {
    const products = Array.from({ length: 12 }, (_, i) =>
      makeProduct({ attributes: { mood: `mood-${i}` } })
    );
    const result = buildProductFilterDefs(
      products,
      [
        {
          key: "mood",
          label: "Mood",
          type: "select",
          options: products.map((_, i) => `mood-${i}`),
        },
      ]
    );
    expect(result.length).toBe(1);
    expect(result[0].values).toHaveLength(12);
  });
});

describe("applyProductAttributeFilters", () => {
  it("keeps only products matching every active filter", () => {
    const products = [
      makeProduct({ id: "a", attributes: { size: "M", color: "Red" } }),
      makeProduct({ id: "b", attributes: { size: "M", color: "Blue" } }),
      makeProduct({ id: "c", attributes: { size: "L", color: "Red" } }),
    ];
    const result = applyProductAttributeFilters(products, {
      size: "M",
      color: "Red",
    });
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });

  it("returns all products when no filters are active", () => {
    const products = [makeProduct({ attributes: { size: "M" } })];
    expect(applyProductAttributeFilters(products, {})).toBe(products);
  });

  it("treats missing attribute values as non-matching", () => {
    const products = [makeProduct({ attributes: {} })];
    expect(applyProductAttributeFilters(products, { size: "M" })).toEqual([]);
  });
});

describe("filterProductsByPrice", () => {
  const products = [
    makeProduct({ id: "a", price_minor: 5000 }),
    makeProduct({ id: "b", price_minor: 15000 }),
    makeProduct({ id: "c", price_minor: 30000 }),
  ];

  it("filters within a min/max range in cedis", () => {
    const result = filterProductsByPrice(products, 100, 200);
    expect(result.map((p) => p.id)).toEqual(["b"]);
  });

  it("supports only a min bound", () => {
    const result = filterProductsByPrice(products, 200);
    expect(result.map((p) => p.id)).toEqual(["c"]);
  });

  it("supports only a max bound", () => {
    const result = filterProductsByPrice(products, undefined, 100);
    expect(result.map((p) => p.id)).toEqual(["a"]);
  });

  it("returns all products when no bounds are given", () => {
    expect(filterProductsByPrice(products)).toHaveLength(3);
  });
});
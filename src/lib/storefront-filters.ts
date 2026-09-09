import type { AttributeDef, Product } from "@/lib/types";

export type ProductFilterValue = { value: string; count: number };

export type ProductFilterDef = {
  key: string;
  label: string;
  values: ProductFilterValue[];
};

const MAX_TEXT_FILTER_VALUES = 10;

export const ATTR_PARAM_PREFIX = "attr_";

export function parseAttributeFilters(
  params: Record<string, string | string[] | undefined>
): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const [key, raw] of Object.entries(params)) {
    if (!key.startsWith(ATTR_PARAM_PREFIX)) continue;
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value) filters[key.slice(ATTR_PARAM_PREFIX.length)] = value;
  }
  return filters;
}

export function parsePriceParam(
  value: string | string[] | undefined
): number | undefined {
  if (value === undefined || value === "") return undefined;
  const raw = Array.isArray(value) ? value[0] : value;
  const num = Number(raw);
  return Number.isFinite(num) && num >= 0 ? num : undefined;
}

export function buildProductFilterDefs(
  products: Product[],
  defs: AttributeDef[]
): ProductFilterDef[] {
  const groups: ProductFilterDef[] = [];
  for (const def of defs) {
    const counts = new Map<string, number>();
    for (const product of products) {
      const value = product.attributes?.[def.key];
      if (typeof value !== "string" || value === "") continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    if (counts.size === 0) continue;
    if (def.type === "text" && counts.size > MAX_TEXT_FILTER_VALUES) continue;
    groups.push({
      key: def.key,
      label: def.label || def.key,
      values: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, count })),
    });
  }
  return groups;
}

export function applyProductAttributeFilters(
  products: Product[],
  filters: Record<string, string>
): Product[] {
  const entries = Object.entries(filters);
  if (entries.length === 0) return products;
  return products.filter((product) =>
    entries.every(([key, value]) => (product.attributes?.[key] ?? "") === value)
  );
}

export function filterProductsByPrice(
  products: Product[],
  min?: number,
  max?: number
): Product[] {
  if (min === undefined && max === undefined) return products;
  return products.filter((p) => {
    const price = p.price_minor / 100;
    if (min !== undefined && price < min) return false;
    if (max !== undefined && price > max) return false;
    return true;
  });
}
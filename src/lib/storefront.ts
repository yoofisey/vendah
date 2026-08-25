import "server-only";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type {
  AttributeDef,
  Product,
  ProductCategory,
  ProductReview,
  Tenant,
} from "@/lib/types";

export const getTenantBySubdomain = cache(
  async (subdomain: string): Promise<Tenant | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .eq("subdomain", subdomain)
      .maybeSingle();
    return (data as Tenant) ?? null;
  }
);

export const getTenantBusinessCategorySlug = cache(
  async (tenantId: string): Promise<string | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("business_category_id")
      .eq("id", tenantId)
      .maybeSingle();
    if (!data?.business_category_id) return null;
    const { data: category } = await supabase
      .from("business_categories")
      .select("slug")
      .eq("id", data.business_category_id)
      .maybeSingle();
    return (category?.slug as string) ?? null;
  }
);

export const getTenantBusinessCategoryIds = cache(
  async (tenantId: string): Promise<string[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("tenants")
      .select("business_category_ids")
      .eq("id", tenantId)
      .maybeSingle();
    return (data?.business_category_ids as string[]) ?? [];
  }
);

export const getBusinessCategoriesByIds = cache(
  async (ids: string[]): Promise<{ id: string; slug: string; name: string }[]> => {
    if (ids.length === 0) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("business_categories")
      .select("id, slug, name")
      .in("id", ids);
    return (data ?? []) as { id: string; slug: string; name: string }[];
  }
);

export const getCategoryAttributeDefsForIds = cache(
  async (categoryIds: string[]): Promise<AttributeDef[]> => {
    if (categoryIds.length === 0) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("business_categories")
      .select("attribute_defs")
      .in("id", categoryIds);
    const seen = new Set<string>();
    const merged: AttributeDef[] = [];
    for (const row of data ?? []) {
      const defs = (row.attribute_defs as AttributeDef[]) ?? [];
      for (const def of defs) {
        if (!seen.has(def.key)) {
          seen.add(def.key);
          merged.push(def);
        }
      }
    }
    return merged;
  }
);

export type ProductSortOption =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "popular";

export type GetStorefrontProductsOptions = {
  sort?: ProductSortOption;
  minPrice?: number;
  maxPrice?: number;
};

export const getStorefrontProducts = cache(
  async (
    tenantId: string,
    options: GetStorefrontProductsOptions = {}
  ): Promise<Product[]> => {
    const supabase = await createClient();
    const { sort = "newest", minPrice, maxPrice } = options;

    if (sort === "popular") {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("status", "active");
      let products = (data as Product[]) ?? [];

      if (minPrice !== undefined) {
        products = products.filter((p) => p.price_minor / 100 >= minPrice);
      }
      if (maxPrice !== undefined) {
        products = products.filter((p) => p.price_minor / 100 <= maxPrice);
      }

      if (products.length === 0) return [];

      const productIds = products.map((p) => p.id);
      const { data: rows } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .in("product_id", productIds);

      const popularity = new Map<string, number>();
      for (const row of rows ?? []) {
        if (!row.product_id) continue;
        popularity.set(
          row.product_id,
          (popularity.get(row.product_id) ?? 0) + Number(row.quantity)
        );
      }

      return products
        .map((p) => ({ p, score: popularity.get(p.id) ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .map((entry) => entry.p);
    }

    let query = supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "active");

    if (minPrice !== undefined) {
      query = query.gte("price_minor", Math.round(minPrice * 100));
    }
    if (maxPrice !== undefined) {
      query = query.lte("price_minor", Math.round(maxPrice * 100));
    }

    if (sort === "price_asc") {
      query = query.order("price_minor", { ascending: true });
    } else if (sort === "price_desc") {
      query = query.order("price_minor", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = await query;
    return (data as Product[]) ?? [];
  }
);

export const getProductBySlug = cache(
  async (tenantId: string, slug: string): Promise<Product | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .maybeSingle();
    return (data as Product) ?? null;
  }
);

export const getCategoryAttributeDefs = cache(
  async (categoryId: string): Promise<AttributeDef[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("business_categories")
      .select("attribute_defs")
      .eq("id", categoryId)
      .maybeSingle();
    return ((data?.attribute_defs as AttributeDef[]) ?? []);
  }
);

export type ProductCategoryWithCount = ProductCategory & {
  product_count: number;
};

export const getProductCategories = cache(
  async (tenantId: string): Promise<ProductCategoryWithCount[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("product_categories")
      .select("*, products(count)")
      .eq("tenant_id", tenantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    return (
      (data as unknown as (ProductCategory & { products: { count: number }[] })[])?.map(
        (c) => ({
          ...c,
          product_count:
            c.products.length > 0
              ? Number(c.products[0].count)
              : 0,
        })
      ) ?? []
    );
  }
);

export const getProductCategoryBySlug = cache(
  async (tenantId: string, slug: string): Promise<ProductCategory | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("slug", slug)
      .maybeSingle();
    return (data as ProductCategory) ?? null;
  }
);

export const getProductCategoryById = cache(
  async (tenantId: string, id: string): Promise<ProductCategory | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("product_categories")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .maybeSingle();
    return (data as ProductCategory) ?? null;
  }
);

export const getProductsByCategory = cache(
  async (tenantId: string, categoryId: string): Promise<Product[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("category_id", categoryId)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    return (data as Product[]) ?? [];
  }
);

export const getFeaturedProducts = cache(
  async (tenantId: string): Promise<Product[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("featured", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(8);
    return (data as Product[]) ?? [];
  }
);

export const getBestSellers = cache(
  async (tenantId: string, limit = 8): Promise<Product[]> => {
    const products = await getStorefrontProducts(tenantId);
    if (products.length === 0) return [];
    const supabase = await createClient();
    const { data: rows } = await supabase
      .from("order_items")
      .select("product_id, quantity")
      .in(
        "product_id",
        products.map((p) => p.id)
      );
    const popularity = new Map<string, number>();
    for (const row of rows ?? []) {
      if (!row.product_id) continue;
      popularity.set(
        row.product_id,
        (popularity.get(row.product_id) ?? 0) + Number(row.quantity)
      );
    }
    return products
      .map((p) => ({ p, score: popularity.get(p.id) ?? 0 }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry) => entry.p);
  }
);

export const getProductReviews = cache(
  async (tenantId: string, productId: string): Promise<ProductReview[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data as ProductReview[]) ?? [];
  }
);

export type ReviewSummary = {
  average: number;
  count: number;
  distribution: number[]; // [1..5]
};

export const getReviewSummary = cache(
  async (tenantId: string, productId: string): Promise<ReviewSummary> => {
    const reviews = await getProductReviews(tenantId, productId);
    const distribution = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of reviews) {
      const rating = Math.min(5, Math.max(1, r.rating));
      distribution[rating - 1] += 1;
      sum += rating;
    }
    return {
      average: reviews.length > 0 ? sum / reviews.length : 0,
      count: reviews.length,
      distribution,
    };
  }
);

export type TrackedOrder = {
  id: string;
  reference: string;
  customer_name: string;
  status: string;
  total_minor: number;
  currency: string;
  delivery_method: string | null;
  notes: string | null;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    price_minor: number;
    quantity: number;
    attributes: Record<string, string>;
  }[];
};

export const getOrderForTracking = cache(
  async (
    tenantId: string,
    reference: string,
    contact: string
  ): Promise<TrackedOrder | null> => {
    const supabase = await createClient();
    const safe = contact.replace(/,/g, "");
    const { data: order } = await supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .ilike("reference", reference)
      .or(`customer_phone.eq.${safe},customer_email.ilike.${safe}`)
      .maybeSingle();
    if (!order) return null;

    const { data: items } = await supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("id", { ascending: true });
    return {
      id: order.id,
      reference: order.reference,
      customer_name: order.customer_name,
      status: order.status,
      total_minor: Number(order.total_minor),
      currency: order.currency,
      delivery_method: order.delivery_method,
      notes: order.notes,
      created_at: order.created_at,
      items: (items ?? []).map((i) => ({
        id: i.id,
        product_name: i.product_name,
        price_minor: Number(i.price_minor),
        quantity: i.quantity,
        attributes: (i.attributes ?? {}) as Record<string, string>,
      })),
    };
  }
);

export const searchProducts = cache(
  async (tenantId: string, query: string): Promise<Product[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .ilike("name", `%${query}%`)
      .order("created_at", { ascending: false });
    const byName = (data as Product[]) ?? [];

    const { data: byDescription } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .ilike("description", `%${query}%`)
      .order("created_at", { ascending: false });

    const seen = new Set<string>();
    const merged: Product[] = [];
    for (const p of [...byName, ...((byDescription as Product[]) ?? [])]) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        merged.push(p);
      }
    }
    return merged;
  }
);

export const getRelatedProducts = cache(
  async (
    tenantId: string,
    categoryId: string | null,
    excludeId: string
  ): Promise<Product[]> => {
    if (!categoryId) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("category_id", categoryId)
      .eq("status", "active")
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(4);
    return (data as Product[]) ?? [];
  }
);

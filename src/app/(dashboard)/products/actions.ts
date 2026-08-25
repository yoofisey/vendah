"use server";

import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { PLANS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/tenant";
import { notifyBackInStock } from "@/lib/back-in-stock";
import type { SubscriptionTier } from "@/lib/types";

export type ProductState = { error?: string; success?: boolean };

const productSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(120),
  priceMinor: z.number().int().min(1).max(1000000000),
  stock: z.number().int().min(0).max(1000000),
  description: z.string().max(2000),
  status: z.enum(["draft", "active"]),
  images: z.array(z.string().url()).max(8),
  imageAlts: z.array(z.string()).max(8),
  attributes: z.record(z.string(), z.string()),
  categoryId: z.string().uuid().nullable().optional(),
  featured: z.boolean(),
  sku: z.string().max(64).optional().nullable(),
  weightGrams: z.number().int().min(0).max(1000000).optional().nullable(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

function parseJson(value: unknown, fallback: unknown): unknown {
  try {
    return JSON.parse(String(value ?? ""));
  } catch {
    return fallback;
  }
}

export async function saveProduct(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const user = await requireUser();

  const parsed = productSchema.safeParse({
    id: String(formData.get("id") ?? "").trim() || undefined,
    name: String(formData.get("name") ?? "").trim(),
    priceMinor: Math.round(Number(formData.get("price") ?? 0) * 100),
    stock: Number(formData.get("stock") ?? 0),
    description: String(formData.get("description") ?? "").trim(),
    status: String(formData.get("status") ?? "draft"),
    images: parseJson(formData.get("images"), []),
    imageAlts: parseJson(formData.get("imageAlts"), []),
    attributes: parseJson(formData.get("attributes"), {}),
    categoryId:
      String(formData.get("category") ?? "").trim() || null,
    featured: formData.get("featured") === "on",
    sku: String(formData.get("sku") ?? "").trim() || undefined,
    weightGrams: Number(formData.get("weight_grams")) || undefined,
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || undefined,
    metaDescription:
      String(formData.get("metaDescription") ?? "").trim() || undefined,
  });
  if (!parsed.success) return { error: "Check the product details." };
  const data = parsed.data;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, status, subscription_tier")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant || tenant.status !== "active") {
    return { error: "Finish setting up your shop first." };
  }

  if (data.categoryId) {
    const { data: category } = await admin
      .from("product_categories")
      .select("id")
      .eq("id", data.categoryId)
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (!category) return { error: "Category not found." };
  }

  if (data.id) {
    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("id", data.id)
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    if (!existing) return { error: "Product not found." };

    const { data: productBefore } = await admin
      .from("products")
      .select("stock")
      .eq("id", data.id)
      .maybeSingle();
    const previousStock = productBefore?.stock ?? 0;

    const { error } = await admin
      .from("products")
      .update({
        name: data.name,
        price_minor: data.priceMinor,
        stock: data.stock,
        description: data.description,
        status: data.status,
        images: data.images,
        image_alts: data.imageAlts,
        attributes: data.attributes,
        category_id: data.categoryId,
        featured: data.featured,
        sku: data.sku ?? null,
        weight_grams: data.weightGrams ?? null,
        meta_title: data.metaTitle ?? null,
        meta_description: data.metaDescription ?? null,
      })
      .eq("id", data.id);
    if (error) return { error: error.message };

    if (previousStock === 0 && data.stock > 0) {
      await notifyBackInStock(tenant.id, data.id);
    }

    return { success: true };
  }

  const plan = PLANS[tenant.subscription_tier as SubscriptionTier];
  if (plan.productLimit !== null) {
    const { count } = await admin
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .neq("status", "archived");
    if ((count ?? 0) >= plan.productLimit) {
      return {
        error: `You've reached the ${plan.productLimit}-product limit on your ${plan.name} plan. Upgrade to add more.`,
      };
    }
  }

  const slug = await uniqueProductSlug(admin, tenant.id, data.name);
  const { error } = await admin.from("products").insert({
    tenant_id: tenant.id,
    name: data.name,
    slug,
    description: data.description,
    price_minor: data.priceMinor,
    stock: data.stock,
    images: data.images,
    image_alts: data.imageAlts,
    attributes: data.attributes,
    status: data.status,
    category_id: data.categoryId,
    featured: data.featured,
    sku: data.sku ?? null,
    weight_grams: data.weightGrams ?? null,
    meta_title: data.metaTitle ?? null,
    meta_description: data.metaDescription ?? null,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function createCategory(
  _prev: ProductState,
  formData: FormData
): Promise<ProductState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    return { error: "Enter a category name." };
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return { error: "No shop found." };

  const base = slugify(name) || "category";
  let slug = base;
  const { data: existing } = await admin
    .from("product_categories")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("slug", slug)
    .maybeSingle();
  if (existing) {
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const { error } = await admin.from("product_categories").insert({
    tenant_id: tenant.id,
    name,
    slug,
  });
  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return;
  await admin
    .from("product_categories")
    .delete()
    .eq("id", categoryId)
    .eq("tenant_id", tenant.id);
}

export async function archiveProduct(productId: string): Promise<void> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return;
  await admin
    .from("products")
    .update({ status: "archived" })
    .eq("id", productId)
    .eq("tenant_id", tenant.id);
}

export type VariantState = { error?: string; success?: boolean };

export async function saveVariants(
  productId: string,
  variants: {
    id?: string;
    name: string;
    sku: string | null;
    price_override_minor: number | null;
    stock: number;
    attributes: Record<string, string>;
    sort_order: number;
  }[]
): Promise<VariantState> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return { error: "No shop found." };

  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!product) return { error: "Product not found." };

  const existingIds = new Set(
    variants.filter((v) => v.id).map((v) => v.id as string)
  );

  const { data: existingVariants } = await admin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId)
    .eq("tenant_id", tenant.id);

  const toDelete = (existingVariants ?? [])
    .map((v) => v.id as string)
    .filter((id) => !existingIds.has(id));

  if (toDelete.length > 0) {
    await admin
      .from("product_variants")
      .delete()
      .in("id", toDelete);
  }

  const rows = variants.map((v, i) => ({
    id: v.id || undefined,
    tenant_id: tenant.id,
    product_id: productId,
    name: v.name,
    sku: v.sku || null,
    price_override_minor: v.price_override_minor,
    stock: v.stock,
    attributes: v.attributes,
    sort_order: i,
  }));

  for (const row of rows) {
    if (row.id) {
      const { error } = await admin
        .from("product_variants")
        .update({
          name: row.name,
          sku: row.sku,
          price_override_minor: row.price_override_minor,
          stock: row.stock,
          attributes: row.attributes,
          sort_order: row.sort_order,
        })
        .eq("id", row.id)
        .eq("tenant_id", tenant.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await admin.from("product_variants").insert({
        tenant_id: tenant.id,
        product_id: productId,
        name: row.name,
        sku: row.sku,
        price_override_minor: row.price_override_minor,
        stock: row.stock,
        attributes: row.attributes,
        sort_order: row.sort_order,
      });
      if (error) return { error: error.message };
    }
  }

  return { success: true };
}

export async function deleteVariant(variantId: string): Promise<void> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return;
  await admin
    .from("product_variants")
    .delete()
    .eq("id", variantId)
    .eq("tenant_id", tenant.id);
}

async function uniqueProductSlug(
  admin: ReturnType<typeof createAdminClient>,
  tenantId: string,
  name: string
): Promise<string> {
  const base = slugify(name) || "product";
  for (let i = 0; i < 5; i++) {
    const candidate =
      i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin
      .from("products")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

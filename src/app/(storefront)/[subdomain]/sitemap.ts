import type { MetadataRoute } from "next";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStorefrontUrl } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function sitemap({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<MetadataRoute.Sitemap> {
  const { subdomain } = await params;
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, subdomain, updated_at")
    .eq("subdomain", subdomain)
    .eq("status", "active")
    .maybeSingle();

  if (!tenant) return [];

  const base = getStorefrontUrl(subdomain);

  const { data: products } = await admin
    .from("products")
    .select("slug, updated_at")
    .eq("tenant_id", tenant.id)
    .eq("status", "active");

  const { data: categories } = await admin
    .from("product_categories")
    .select("slug, updated_at")
    .eq("tenant_id", tenant.id)
    .eq("active", true);

  const entries: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: tenant.updated_at ? new Date(tenant.updated_at) : new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/shop`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${base}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${base}/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${base}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  for (const cat of categories ?? []) {
    entries.push({
      url: `${base}/category/${cat.slug}`,
      lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    });
  }

  for (const product of products ?? []) {
    entries.push({
      url: `${base}/products/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}

import { notFound, redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import {
  getCategoryAttributeDefsForIds,
  getProductCategories,
} from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import type { Product, ProductVariant } from "@/lib/types";
import { ProductForm } from "../../product-form";
import { VariantManager } from "@/components/dashboard/variant-manager";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const product = (data as Product) ?? null;
  if (!product) notFound();

  const categoryIds = tenant.business_category_ids?.length
    ? tenant.business_category_ids
    : tenant.business_category_id
      ? [tenant.business_category_id]
      : [];

  const [attributeDefs, categories, { data: variantsData }] = await Promise.all([
    getCategoryAttributeDefsForIds(categoryIds),
    getProductCategories(tenant.id),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", id)
      .eq("tenant_id", tenant.id)
      .order("sort_order", { ascending: true }),
  ]);

  const variants = (variantsData as ProductVariant[]) ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold text-charcoal">
        Edit product
      </h1>
      <p className="mt-1 text-sm text-muted">Update {product.name}.</p>
      <ProductForm
        tenantId={tenant.id}
        attributeDefs={attributeDefs}
        categories={categories}
        product={product}
      />
      <div className="mt-6">
        <VariantManager
          tenantId={tenant.id}
          productId={product.id}
          variants={variants}
          attributeDefs={attributeDefs}
        />
      </div>
    </div>
  );
}

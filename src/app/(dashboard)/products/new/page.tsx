import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import {
  getCategoryAttributeDefsForIds,
  getProductCategories,
} from "@/lib/storefront";
import { ProductForm } from "../product-form";

export default async function NewProductPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const categoryIds = tenant.business_category_ids?.length
    ? tenant.business_category_ids
    : tenant.business_category_id
      ? [tenant.business_category_id]
      : [];

  const [attributeDefs, categories] = await Promise.all([
    getCategoryAttributeDefsForIds(categoryIds),
    getProductCategories(tenant.id),
  ]);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-heading text-2xl font-semibold text-charcoal">
        New product
      </h1>
      <p className="mt-1 text-sm text-muted">
        Add a product to your storefront.
      </p>
      <ProductForm
        tenantId={tenant.id}
        attributeDefs={attributeDefs}
        categories={categories}
        product={null}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  getProductCategoryBySlug,
  getProductsByCategory,
  getTenantBusinessCategorySlug,
  getTenantBySubdomain,
} from "@/lib/storefront";
import { getCategoryPreset } from "@/lib/category-presets";
import { ProductCard } from "../../product-card";
import { productGridClasses } from "../../storefront-grid";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const [category, businessCategorySlug] = await Promise.all([
    getProductCategoryBySlug(tenant.id, slug),
    getTenantBusinessCategorySlug(tenant.id),
  ]);
  if (!category) notFound();

  const preset = getCategoryPreset(businessCategorySlug);
  const products = await getProductsByCategory(tenant.id, category.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/shop"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition duration-150 hover:text-pine"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to shop
      </Link>

      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        {category.name}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {products.length === 0
          ? "Nothing here yet."
          : `${products.length} ${products.length === 1 ? "product" : "products"}.`}
      </p>

      {products.length > 0 ? (
        <div className={productGridClasses(preset.layout, "all")}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tenantId={tenant.id}
              variant={preset.cardStyle}
            />
          ))}
        </div>
      ) : (
        <p className="mt-8 rounded-2xl border border-dashed border-charcoal/20 bg-white p-14 text-center text-sm text-muted shadow-sm">
          We&apos;re still filling this category. Check back soon, or{" "}
          <Link href="/shop" className="font-medium text-pine underline-offset-4 hover:underline">
            browse all products
          </Link>
          .
        </p>
      )}
    </div>
  );
}

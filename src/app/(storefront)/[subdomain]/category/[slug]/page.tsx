import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";
import {
  getCategoryAttributeDefsForIds,
  getProductCategoryBySlug,
  getProductsByCategory,
  getTenantBusinessCategorySlug,
  getTenantBySubdomain,
  sortProducts,
} from "@/lib/storefront";
import {
  applyProductAttributeFilters,
  buildProductFilterDefs,
  filterProductsByPrice,
  parseAttributeFilters,
  parsePriceParam,
} from "@/lib/storefront-filters";
import { getCategoryPreset } from "@/lib/category-presets";
import { ProductCard } from "../../product-card";
import { ProductSort } from "../../product-sort";
import { PriceRangeFilter } from "../../price-range-filter";
import { AttributeFilters } from "../../attribute-filters";
import { productGridClasses } from "../../storefront-grid";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
  searchParams: Promise<{ sort?: string; min_price?: string; max_price?: string }>;
}) {
  const { subdomain, slug } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const [category, businessCategorySlug, attributeDefs] = await Promise.all([
    getProductCategoryBySlug(tenant.id, slug),
    getTenantBusinessCategorySlug(tenant.id),
    getCategoryAttributeDefsForIds(tenant.business_category_ids),
  ]);
  if (!category) notFound();

  const sp = await searchParams;
  const sort = sp.sort ?? "newest";
  const minPrice = parsePriceParam(sp.min_price);
  const maxPrice = parsePriceParam(sp.max_price);

  const preset = getCategoryPreset(businessCategorySlug);
  const allProducts = await getProductsByCategory(tenant.id, category.id);

  const attrFilters = parseAttributeFilters(sp);
  const filterDefs = buildProductFilterDefs(allProducts, attributeDefs);
  const hasActiveFilters =
    Object.keys(attrFilters).length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  const filtered = applyProductAttributeFilters(
    filterProductsByPrice(allProducts, minPrice, maxPrice),
    attrFilters
  );
  const products = await sortProducts(filtered, sort);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/shop"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition duration-150 hover:text-pine"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to shop
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            {category.name}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {products.length === 0
              ? hasActiveFilters
                ? "No products match your filters."
                : "No products here yet."
              : `${products.length} ${products.length === 1 ? "product" : "products"}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PriceRangeFilter min={minPrice} max={maxPrice} />
          <ProductSort value={sort} />
        </div>
      </div>

      {filterDefs.length > 0 && (
        <div className="mt-8">
          <AttributeFilters defs={filterDefs} />
        </div>
      )}

      {products.length > 0 ? (
        <div
          className={`${filterDefs.length > 0 ? "mt-8" : "mt-10"} ${productGridClasses(
            preset.layout,
            "all"
          )}`}
        >
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
        <p className="mt-8 rounded-2xl border border-dashed border-charcoal/20 bg-white p-14 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pine/10 text-pine">
            <ShoppingBagIcon className="h-6 w-6" />
          </span>
          <span className="mt-4 block text-sm text-muted">
            {hasActiveFilters
              ? "Nothing in this category matches your filters."
              : "We're still filling this category. Check back soon, or browse all products."}
          </span>
          {hasActiveFilters ? (
            <Link
              href={`/category/${category.slug}`}
              className="mt-5 inline-block rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
            >
              Clear filters
            </Link>
          ) : (
            <Link
              href="/shop"
              className="mt-5 inline-block rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
            >
              Browse all products
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
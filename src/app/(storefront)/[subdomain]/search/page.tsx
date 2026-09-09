import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import {
  getTenantBySubdomain,
  getTenantBusinessCategorySlug,
  searchProducts,
} from "@/lib/storefront";
import { getCategoryPreset } from "@/lib/category-presets";
import { ProductCard } from "../product-card";
import { productGridClasses } from "../storefront-grid";
import { SearchForm } from "./search-form";
import { getStorefrontUrl } from "@/lib/tenant";
import { resolveStorefrontHref } from "@/lib/storefront-href";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const { q } = await searchParams;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return {};

  const query = (q ?? "").trim();
  const title = query ? `Search: ${query} | ${tenant.name}` : `Search | ${tenant.name}`;
  const description = query
    ? `Search results for "${query}" at ${tenant.name}.`
    : `Search products at ${tenant.name}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${getStorefrontUrl(subdomain)}/search${query ? `?q=${encodeURIComponent(query)}` : ""}`,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { subdomain } = await params;
  const { q } = await searchParams;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const query = (q ?? "").trim();
  const [products, businessCatSlug] = await Promise.all([
    query.length > 0 ? searchProducts(tenant.id, query) : [],
    getTenantBusinessCategorySlug(tenant.id),
  ]);
  const preset = getCategoryPreset(businessCatSlug);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href={resolveStorefrontHref(subdomain, "/shop")}
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted transition duration-150 hover:text-pine"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back to shop
      </Link>

      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        {query ? `Search results for "${query}"` : "Search products"}
      </h1>

      <div className="mt-6 max-w-xl">
        <SearchForm defaultValue={query} />
      </div>

      {query && (
        <p className="mt-4 text-sm text-muted">
          {products.length === 0
            ? "No products found."
            : `${products.length} ${products.length === 1 ? "result" : "results"}.`}
        </p>
      )}

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
        query && (
          <p className="mt-8 rounded-2xl border border-dashed border-charcoal/20 bg-white p-14 text-center text-sm text-muted shadow-sm">
            No products match your search. Try a different keyword or{" "}
            <Link
              href={resolveStorefrontHref(subdomain, "/shop")}
              className="font-medium text-pine underline-offset-4 hover:underline"
            >
              browse all products
            </Link>
            .
          </p>
        )
      )}
    </div>
  );
}

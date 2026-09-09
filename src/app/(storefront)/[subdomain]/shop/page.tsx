import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  TruckIcon,
  LockClosedIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import {
  getBestSellers,
  getCategoryAttributeDefsForIds,
  getFeaturedProducts,
  getProductCategories,
  getStorefrontProducts,
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
import type { CardStyle, CategoryPreset, StorefrontLayout } from "@/lib/category-presets";
import { ProductCard } from "../product-card";
import { ProductSort } from "../product-sort";
import { PriceRangeFilter } from "../price-range-filter";
import { AttributeFilters } from "../attribute-filters";
import { productGridClasses } from "../storefront-grid";
import type { Product, Tenant } from "@/lib/types";
import { getStorefrontUrl } from "@/lib/tenant";
import { resolveStorefrontHref } from "@/lib/storefront-href";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return {};

  const title = `Shop at ${tenant.name}`;
  const description = `Browse products at ${tenant.name}. Quality you can trust.`;

  return {
    title,
    description,
    alternates: { canonical: `${getStorefrontUrl(subdomain)}/shop` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${getStorefrontUrl(subdomain)}/shop`,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ sort?: string; min_price?: string; max_price?: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const sp = await searchParams;
  const sort = sp.sort ?? "newest";
  const minPrice = parsePriceParam(sp.min_price);
  const maxPrice = parsePriceParam(sp.max_price);

  const [products, categories, featured, categorySlug, bestSellers, attributeDefs] =
    await Promise.all([
      getStorefrontProducts(tenant.id),
      getProductCategories(tenant.id),
      getFeaturedProducts(tenant.id),
      getTenantBusinessCategorySlug(tenant.id),
      getBestSellers(tenant.id, 8),
      getCategoryAttributeDefsForIds(tenant.business_category_ids),
    ]);
  const preset = getCategoryPreset(categorySlug);

  const attrFilters = parseAttributeFilters(sp);
  const filterDefs = buildProductFilterDefs(products, attributeDefs);
  const hasActiveFilters =
    Object.keys(attrFilters).length > 0 ||
    minPrice !== undefined ||
    maxPrice !== undefined;

  const filtered = applyProductAttributeFilters(
    filterProductsByPrice(products, minPrice, maxPrice),
    attrFilters
  );
  const sorted = await sortProducts(filtered, sort);

  const shownIds = new Set(sorted.map((p) => p.id));
  const featuredOnly = featured.filter((p) => !shownIds.has(p.id));
  for (const p of featuredOnly) shownIds.add(p.id);
  const bestSellersOnly = bestSellers.filter((p) => !shownIds.has(p.id));

  return (
    <div>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <CategoryBar
          categories={categories}
          sort={sort}
          layout={preset.layout}
          subdomain={subdomain}
        />

        <div
          className={`mt-6 flex flex-wrap items-end justify-between gap-4 ${
            preset.layout === "masonry" ? "sr-only" : ""
          }`}
        >
          <div>
            <h2 className="font-heading text-3xl font-semibold text-charcoal">
              {preset.layout === "dense" ? "Shop now" : "Our products"}
            </h2>
            <p className="mt-1 text-sm text-muted">
              Showing {sorted.length}{" "}
              {sorted.length === 1 ? "product" : "products"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PriceRangeFilter min={minPrice} max={maxPrice} />
            {categories.length === 0 && <ProductSort value={sort} />}
          </div>
        </div>

        {filterDefs.length > 0 && (
          <div className="mt-6">
            <AttributeFilters defs={filterDefs} />
          </div>
        )}

        {sorted.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-charcoal/20 bg-white p-14 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine/10 text-pine">
              <ShoppingBagIcon className="h-7 w-7" />
            </span>
            <h3 className="mt-4 font-heading text-xl font-semibold text-charcoal">
              {hasActiveFilters ? "No matches" : "No products yet"}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
              {hasActiveFilters
                ? "Nothing in the catalogue matches your filters. Try clearing them to see everything we have."
                : "We're putting the finishing touches on our catalogue. Check back soon — something great is on its way!"}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {hasActiveFilters ? (
                <Link
                  href={resolveStorefrontHref(subdomain, "/shop")}
                  className="rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
                >
                  Clear filters
                </Link>
              ) : (
                <Link
                  href={resolveStorefrontHref(subdomain, "/")}
                  className="rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
                >
                  Back to home
                </Link>
              )}
              <Link
                href={resolveStorefrontHref(subdomain, "/contact")}
                className="rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
              >
                Contact us
              </Link>
            </div>
          </div>
        ) : (
          <div className={`mt-6 ${productGridClasses(preset.layout, "all")}`}>
            {sorted.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                tenantId={tenant.id}
                variant={preset.cardStyle}
              />
            ))}
          </div>
        )}

        {preset.layout !== "masonry" && featuredOnly.length > 0 && (
          <FeaturedSection
            products={featuredOnly}
            tenantId={tenant.id}
            cardStyle={preset.cardStyle}
            layout={preset.layout}
          />
        )}

        {bestSellersOnly.length > 0 && (
          <BestSellersSection
            products={bestSellersOnly}
            tenantId={tenant.id}
            cardStyle={preset.cardStyle}
            layout={preset.layout}
          />
        )}
      </div>

      <ValueProps tenant={tenant} preset={preset} />

      <AboutStrip tenant={tenant} preset={preset} subdomain={subdomain} />
    </div>
  );
}

function CategoryBar({
  categories,
  sort,
  layout,
  subdomain,
}: {
  categories: { id: string; slug: string; name: string }[];
  sort: string;
  layout: StorefrontLayout;
  subdomain: string;
}) {
  if (categories.length === 0) return null;

  if (layout === "dense") {
    return (
      <nav
        className="-mx-4 mb-8 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
        aria-label="Categories"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={resolveStorefrontHref(subdomain, `/category/${category.slug}`)}
            className="whitespace-nowrap rounded-full border border-charcoal/15 bg-white px-3.5 py-1.5 text-xs font-medium text-charcoal-soft transition duration-150 hover:border-pine hover:text-pine"
          >
            {category.name}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-4 rounded-2xl border border-charcoal/10 bg-white px-5 py-4 shadow-sm ${
        layout === "masonry" ? "rounded-full px-4 py-2.5" : ""
      }`}
    >
      <nav
        className="flex flex-1 gap-2 overflow-x-auto pb-0.5"
        aria-label="Categories"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={resolveStorefrontHref(subdomain, `/category/${category.slug}`)}
            className="whitespace-nowrap rounded-full border border-charcoal/15 bg-cream px-4 py-2 text-sm font-medium text-charcoal-soft transition duration-150 hover:border-pine hover:text-pine"
          >
            {category.name}
          </Link>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <ProductSort value={sort} />
      </div>
    </div>
  );
}

function ValueProps({ tenant, preset }: { tenant: Tenant; preset: CategoryPreset }) {
  const CATEGORY_PROPS: Record<string, { icon: typeof TruckIcon; title: string; text: string }[]> = {
    clothing: [
      { icon: TruckIcon, title: "Fast delivery", text: "Your order arrives carefully packed within 1–3 days." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Easy returns", text: "Didn't love it? Return within 7 days — no questions asked." },
    ],
    cosmetics: [
      { icon: TruckIcon, title: "Free delivery over ₵200", text: "We deliver nationwide. Orders over ₵200 ship free." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Authentic products", text: "Every item is sourced directly from authorised suppliers." },
    ],
    jewelry: [
      { icon: TruckIcon, title: "Insured shipping", text: "Every order is fully insured and signature-required on delivery." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Certificate of authenticity", text: "Each piece comes with a certificate of quality and materials." },
    ],
    groceries: [
      { icon: TruckIcon, title: "Same-day delivery", text: "Order before 12 noon and get it delivered today." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Freshness guarantee", text: "Not fresh? We'll replace it or give you a full refund." },
    ],
    electronics: [
      { icon: TruckIcon, title: "Nationwide delivery", text: "Fast delivery to every region in Ghana." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Warranty included", text: "All electronics come with a minimum 6-month warranty." },
    ],
    "home-living": [
      { icon: TruckIcon, title: "Careful delivery", text: "Fragile items are double-packed and handled with care." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "30-day returns", text: "Changed your mind? Return within 30 days for a full refund." },
    ],
    "health-wellness": [
      { icon: TruckIcon, title: "Discreet packaging", text: "All orders ship in plain, unmarked packaging." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Certified products", text: "Every product meets NAFDAC and international quality standards." },
    ],
    "books-stationery": [
      { icon: TruckIcon, title: "Gift wrapping available", text: "Add gift wrapping at checkout — we'll make it special." },
      { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
      { icon: ArrowPathIcon, title: "Rare finds", text: "We source hard-to-find titles and specialty stationery." },
    ],
  };

  const items = CATEGORY_PROPS[preset.slug] ?? [
    { icon: TruckIcon, title: "Delivery or pickup", text: tenant.contact_info?.deliveryNotes ?? "Fast, reliable delivery across our service areas." },
    { icon: LockClosedIcon, title: "Secure checkout", text: "Pay safely with card or mobile money via Paystack." },
    { icon: ArrowPathIcon, title: "Easy returns", text: "Damaged or wrong item? We'll sort it within 7 days." },
  ];

  return (
    <section className="border-b border-charcoal/5 bg-white">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:px-6 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.title} className="flex gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine/10">
              <item.icon className="h-5 w-5 text-pine" />
            </span>
            <div>
              <p className="text-sm font-semibold text-charcoal">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function BestSellersSection({
  products,
  tenantId,
  cardStyle,
  layout,
}: {
  products: Product[];
  tenantId: string;
  cardStyle: CardStyle;
  layout: StorefrontLayout;
}) {
  return (
    <section className="mb-16 mt-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-charcoal">
          Best sellers
        </h2>
        <span className="hidden h-px flex-1 bg-charcoal/10 sm:block" />
      </div>
      <div className={`mt-6 ${productGridClasses(layout, "featured")}`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenantId={tenantId}
            variant={cardStyle}
          />
        ))}
      </div>
    </section>
  );
}

function AboutStrip({
  tenant,
  preset,
  subdomain,
}: {
  tenant: Tenant;
  preset: CategoryPreset;
  subdomain: string;
}) {
  const CATEGORY_ABOUT: Record<string, { storyLabel: string; detailLabel: string }> = {
    clothing: { storyLabel: "Our collections", detailLabel: "Size guide" },
    cosmetics: { storyLabel: "Our ingredients", detailLabel: "Beauty tips" },
    jewelry: { storyLabel: "Our craft", detailLabel: "Care guide" },
    groceries: { storyLabel: "Our suppliers", detailLabel: "Freshness promise" },
    electronics: { storyLabel: "Our brands", detailLabel: "Warranty info" },
    "home-living": { storyLabel: "Our story", detailLabel: "Delivery & returns" },
    "health-wellness": { storyLabel: "Our philosophy", detailLabel: "Wellness guide" },
    "books-stationery": { storyLabel: "The shelves", detailLabel: "Gift options" },
  };

  const ctas = CATEGORY_ABOUT[preset.slug] ?? { storyLabel: "Our story", detailLabel: "Delivery & returns" };

  return (
    <section className="bg-brand text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-8 px-4 py-16 sm:px-6 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-light">
            About {tenant.name}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-white/85">
            {tenant.about_text?.trim() ||
              `${tenant.name} is a shop on venfii — quality products, honest prices and service you can count on.`}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-4">
          <Link
            href={resolveStorefrontHref(subdomain, "/about")}
            className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-charcoal shadow-lg transition duration-200 hover:bg-gold-dark hover:text-white"
          >
            {ctas.storyLabel}
          </Link>
          <Link
            href={resolveStorefrontHref(subdomain, "/delivery")}
            className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-white/10"
          >
            {ctas.detailLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

function FeaturedSection({
  products,
  tenantId,
  cardStyle,
  layout,
}: {
  products: Product[];
  tenantId: string;
  cardStyle: CardStyle;
  layout: StorefrontLayout;
}) {
  return (
    <section className="mb-16 mt-12">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-heading text-3xl font-semibold text-charcoal">
          Featured
        </h2>
        <span className="hidden h-px flex-1 bg-charcoal/10 sm:block" />
      </div>
      <div className={`mt-6 ${productGridClasses(layout, "featured")}`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenantId={tenantId}
            variant={cardStyle}
          />
        ))}
      </div>
    </section>
  );
}

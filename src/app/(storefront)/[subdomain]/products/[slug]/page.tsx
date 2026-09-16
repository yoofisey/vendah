import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ShieldCheckIcon,
  StarIcon,
  TruckIcon,
  CheckBadgeIcon,
  ClockIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/solid";
import { formatMoney } from "@/lib/format";
import {
  getCategoryAttributeDefs,
  getProductBySlug,
  getProductCategoryById,
  getProductReviews,
  getRelatedProducts,
  getReviewSummary,
  getTenantBusinessCategorySlug,
  getTenantBySubdomain,
} from "@/lib/storefront";
import { getCategoryPreset } from "@/lib/category-presets";
import { getStorefrontUrl } from "@/lib/tenant";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import { createClient } from "@/lib/supabase/server";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { WhatsAppShareButton } from "@/components/storefront/whatsapp-share";
import { AddToCart } from "./add-to-cart";
import { ImageGallery } from "./image-gallery";
import { VariantClientSection } from "./variant-section";
import { ProductCard } from "../../product-card";
import { ReviewForm } from "./review-form";
import { BackInStockButton } from "@/components/storefront/back-in-stock-button";
import { TrustBadgeStrip } from "@/components/storefront/trust-badge";
import type { ProductReview, ProductVariant } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}): Promise<Metadata> {
  const { subdomain, slug } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return {};
  const product = await getProductBySlug(tenant.id, slug);
  if (!product) return {};

  const description =
    product.meta_description ||
    product.description?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Shop ${product.name} at ${tenant.name}.`;

  return {
    title: product.meta_title || product.name,
    description,
    alternates: {
      canonical: `${getStorefrontUrl(subdomain)}/products/${product.slug}`,
    },
    openGraph: {
      title: product.meta_title || product.name,
      description,
      type: "website",
      url: `${getStorefrontUrl(subdomain)}/products/${product.slug}`,
      images: product.images?.length
        ? [{ url: product.images[0] }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.meta_title || product.name,
      description,
      images: product.images?.length ? [product.images[0]] : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const product = await getProductBySlug(tenant.id, slug);
  if (!product) notFound();

  const [defs, category, related, businessCategorySlug, reviews, reviewSummary, variantsResult] =
    await Promise.all([
      getCategoryAttributeDefs(tenant.business_category_id),
      product.category_id
        ? getProductCategoryById(tenant.id, product.category_id)
        : Promise.resolve(null),
      getRelatedProducts(tenant.id, product.category_id, product.id),
      getTenantBusinessCategorySlug(tenant.id),
      getProductReviews(tenant.id, product.id),
      getReviewSummary(tenant.id, product.id),
      createClient().then((s) =>
        s
          .from("product_variants")
          .select("*")
          .eq("product_id", product.id)
          .eq("tenant_id", tenant.id)
          .order("sort_order", { ascending: true })
      ),
    ]);
  const preset = getCategoryPreset(businessCategorySlug);
  const variants = (variantsResult.data as ProductVariant[]) ?? [];

  const soldOut = product.stock === 0 && variants.length === 0;
  const lowStock = !soldOut && product.stock <= 5 && variants.length === 0;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description || undefined,
            image: product.images?.length ? product.images : undefined,
            sku: product.slug,
            brand: { "@type": "Organization", name: tenant.name },
            offers: {
              "@type": "Offer",
              priceCurrency: product.currency,
              price: (product.price_minor / 100).toFixed(2),
              availability: product.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
              url: `${getStorefrontUrl(subdomain)}/products/${product.slug}`,
            },
            aggregateRating: reviewSummary.count > 0
              ? {
                  "@type": "AggregateRating",
                  ratingValue: reviewSummary.average.toFixed(1),
                  reviewCount: reviewSummary.count,
                }
              : undefined,
          }),
        }}
      />
      <nav className="mb-8 text-sm text-muted" aria-label="Breadcrumb">
        <Link
          href={resolveStorefrontHref(subdomain, "/shop")}
          className="transition duration-150 hover:text-pine"
        >
          Shop
        </Link>
        {category && (
          <>
            <span className="mx-2.5">/</span>
            <Link
              href={resolveStorefrontHref(subdomain, `/category/${category.slug}`)}
              className="transition duration-150 hover:text-pine"
            >
              {category.name}
            </Link>
          </>
        )}
        <span className="mx-2.5">/</span>
        <span className="font-semibold text-charcoal">{product.name}</span>
      </nav>

      <div className="grid gap-10 sm:grid-cols-2 lg:gap-14">
        <ImageGallery images={product.images ?? []} alts={product.image_alts ?? []} alt={product.name} />

        <div className="flex flex-col">
          <h1 className="font-heading text-3xl font-semibold leading-tight text-charcoal sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-3 text-2xl font-semibold text-brand">
            {formatMoney(product.price_minor, product.currency)}
          </p>

          <p className="mt-3 text-sm text-muted">
            {soldOut ? (
              <span className="font-medium text-red-600">Out of stock</span>
            ) : lowStock ? (
              <span className="font-medium text-amber-600">
                Low stock — only {product.stock} left
              </span>
            ) : (
              <span className="font-medium text-emerald-600">In stock</span>
            )}
          </p>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-base leading-relaxed text-charcoal-soft">
              {product.description}
            </p>
          )}

          <CategoryTrustBadges slug={preset.slug} stock={product.stock} />

          {defs.length > 0 && (
            <dl className="mt-8 divide-y divide-charcoal/10 border-y border-charcoal/10">
              {defs.map((def) => {
                const value = product.attributes?.[def.key];
                if (!value) return null;
                return (
                  <div key={def.key} className="flex justify-between py-3.5 text-sm">
                    <dt className="text-muted">{def.label}</dt>
                    <dd className="font-medium text-charcoal">{value}</dd>
                  </div>
                );
              })}
            </dl>
          )}

          <VariantClientSection
            tenantId={tenant.id}
            product={product}
            variants={variants}
            soldOut={soldOut}
          />
          <TrustBadgeStrip sellerVerified={tenant.payout_verified === true} />
          <div className="mt-5 flex items-center justify-between gap-3">
            <WishlistButton
              tenantId={tenant.id}
              productId={product.id}
              productName={product.name}
              className="h-11 w-11"
            />
            <WhatsAppShareButton
              name={product.name}
              url={`${getStorefrontUrl(subdomain)}/products/${product.slug}`}
              className="h-11 w-11"
            />
            <Link
              href="#reviews"
              className="ml-auto text-sm font-medium text-pine underline-offset-4 hover:underline"
            >
              Read reviews ({reviewSummary.count})
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            Delivery or pickup available —{" "}
            <Link
              href={resolveStorefrontHref(subdomain, "/delivery")}
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              see delivery &amp; returns
            </Link>
            .
          </p>
        </div>
      </div>

      <section id="reviews" className="mt-20 scroll-mt-24">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-charcoal">
              Reviews
            </h2>
            {reviewSummary.count > 0 ? (
              <div className="mt-6 space-y-5">
                <ReviewSummaryBlock summary={reviewSummary} />
                <div className="divide-y divide-charcoal/10 border-t border-charcoal/10">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-6 rounded-xl border border-dashed border-charcoal/20 bg-white p-8 text-sm text-muted">
                No reviews yet. Be the first to review this product.
              </p>
            )}
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-charcoal">
              Write a review
            </h2>
            <div className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
              <ReviewForm tenantId={tenant.id} productId={product.id} />
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 font-heading text-2xl font-semibold text-charcoal">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                tenantId={tenant.id}
                variant={preset.cardStyle}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewSummaryBlock({
  summary,
}: {
  summary: { average: number; count: number; distribution: number[] };
}) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-cream p-6">
      <div className="text-center">
        <p className="font-heading text-4xl font-semibold text-charcoal">
          {summary.average.toFixed(1)}
        </p>
        <div className="mt-1 flex justify-center gap-0.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <StarIcon
              key={value}
              className={`h-4 w-4 ${
                summary.average >= value - 0.25
                  ? "text-gold"
                  : "text-charcoal/15"
              }`}
            />
          ))}
        </div>
        <p className="mt-1 text-xs text-muted">
          {summary.count} {summary.count === 1 ? "review" : "reviews"}
        </p>
      </div>
      <div className="min-w-[160px] flex-1 space-y-1.5">
        {summary.distribution.map((count, i) => {
          const stars = i + 1;
          const pct =
            summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
          return (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 text-muted">{stars}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-charcoal/10">
                <div
                  className="h-full rounded-full bg-gold"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-muted">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewItem({ review }: { review: ProductReview }) {
  return (
    <article className="py-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-charcoal">
          {review.customer_name}
        </p>
        <time className="text-xs text-muted">
          {new Date(review.created_at).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      </div>
      <div className="mt-1.5 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <StarIcon
            key={value}
            className={`h-4 w-4 ${
              value <= review.rating ? "text-gold" : "text-charcoal/15"
            }`}
          />
        ))}
      </div>
      <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-charcoal-soft">
        {review.comment}
      </p>
    </article>
  );
}

function CategoryTrustBadges({ slug, stock }: { slug: string; stock: number }) {
  const CATEGORY_BADGES: Record<
    string,
    { icon: typeof ShieldCheckIcon; label: string; color: string }[]
  > = {
    clothing: [
      { icon: TruckIcon, label: "Free returns within 7 days", color: "text-pine" },
      { icon: CheckBadgeIcon, label: "Quality checked", color: "text-pine" },
    ],
    cosmetics: [
      { icon: CheckBadgeIcon, label: "100% authentic products", color: "text-pine" },
      { icon: ShieldCheckIcon, label: "Sealed & hygienic", color: "text-pine" },
    ],
    jewelry: [
      { icon: ShieldCheckIcon, label: "Certificate of authenticity", color: "text-gold" },
      { icon: CheckBadgeIcon, label: "Insured shipping", color: "text-pine" },
    ],
    groceries: [
      { icon: ClockIcon, label: stock > 20 ? "Fresh & in stock" : "Fresh daily", color: "text-pine" },
      { icon: TruckIcon, label: "Same-day delivery available", color: "text-pine" },
    ],
    electronics: [
      { icon: ShieldCheckIcon, label: "6-month warranty included", color: "text-pine" },
      { icon: CheckBadgeIcon, label: "Tested & certified", color: "text-pine" },
    ],
    "home-living": [
      { icon: TruckIcon, label: "Careful handling & delivery", color: "text-pine" },
      { icon: ArrowPathIcon, label: "30-day easy returns", color: "text-pine" },
    ],
    "health-wellness": [
      { icon: CheckBadgeIcon, label: "NAFDAC approved", color: "text-pine" },
      { icon: ShieldCheckIcon, label: "Discreet packaging", color: "text-pine" },
    ],
    "books-stationery": [
      { icon: CheckBadgeIcon, label: "Gift wrapping available", color: "text-pine" },
      { icon: TruckIcon, label: "Carefully packaged", color: "text-pine" },
    ],
  };

  const badges = CATEGORY_BADGES[slug] ?? [
    { icon: TruckIcon, label: "Fast delivery", color: "text-pine" },
    { icon: ShieldCheckIcon, label: "Secure checkout", color: "text-pine" },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {badges.map((badge) => (
        <span
          key={badge.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-charcoal/10 bg-cream px-3 py-1.5 text-xs font-medium text-charcoal-soft"
        >
          <badge.icon className={`h-3.5 w-3.5 ${badge.color}`} />
          {badge.label}
        </span>
      ))}
    </div>
  );
}

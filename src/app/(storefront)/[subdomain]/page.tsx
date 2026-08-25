import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import {
  getTenantBusinessCategorySlug,
  getTenantBySubdomain,
} from "@/lib/storefront";
import { getCategoryPreset } from "@/lib/category-presets";
import type { CategoryPreset } from "@/lib/category-presets";
import { getHomepageSections } from "@/lib/homepage-sections";
import { HomepageSections } from "@/components/storefront/homepage-sections";
import { ShopNowButton } from "./shop-now-button";
import type { Tenant } from "@/lib/types";
import { getStorefrontUrl } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return {};

  const title = `${tenant.name}${tenant.announcement ? ` — ${tenant.announcement}` : ""}`;
  const description =
    tenant.about_text?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `${tenant.name} — quality products, honest prices and service you can count on.`;

  return {
    title,
    description,
    alternates: { canonical: getStorefrontUrl(subdomain) },
    openGraph: {
      title,
      description,
      type: "website",
      url: getStorefrontUrl(subdomain),
      images: tenant.branding?.bannerUrl
        ? [{ url: tenant.branding.bannerUrl }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function StorefrontHome({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const categorySlug = await getTenantBusinessCategorySlug(tenant.id);
  const preset = getCategoryPreset(categorySlug);
  const sections = await getHomepageSections(tenant.id);

  return (
    <>
      <Hero tenant={tenant} preset={preset} />
      <HomepageSections sections={sections} preset={preset} />
    </>
  );
}

function Hero({
  tenant,
  preset,
}: {
  tenant: Tenant;
  preset: CategoryPreset;
}) {
  const bannerUrl = tenant.branding?.bannerUrl;
  const { layout } = preset;

  return (
    <section
      className={`relative flex items-center overflow-hidden ${
        layout === "dense"
          ? "min-h-[calc(75svh-4rem)]"
          : layout === "masonry"
            ? "min-h-[calc(100svh-4rem)]"
            : "min-h-[calc(100svh-4rem)]"
      }`}
    >
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt={`${tenant.name} banner`}
          fill
          priority
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, ${
              tenant.branding?.primaryColor ?? preset.palette.primary
            }, ${tenant.branding?.accentColor ?? preset.palette.accent})`,
          }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6">
        <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm">
          {preset.name}
        </span>
        <h1
          className={`max-w-xl font-heading font-semibold leading-tight text-white ${
            layout === "editorial"
              ? "text-5xl sm:text-6xl"
              : layout === "dense"
                ? "text-3xl sm:text-4xl"
                : "text-4xl sm:text-5xl"
          }`}
        >
          {tenant.name}
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">
          {preset.heroSubtitle}
        </p>
        <ShopNowButton
          shopName={tenant.name}
          variant={layout === "editorial" ? "glass" : "solid"}
        />
      </div>
    </section>
  );
}

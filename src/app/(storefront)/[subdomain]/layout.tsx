import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TenantTheme } from "@/components/tenant-theme";
import { PWAInstallPrompt } from "@/components/storefront/pwa-install-prompt";
import { CartDrawerProvider } from "@/components/storefront/cart-drawer";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import {
  getTenantBusinessCategorySlug,
  getTenantBySubdomain,
} from "@/lib/storefront";
import { getCategoryPreset } from "@/lib/category-presets";
import { getStorefrontUrl } from "@/lib/tenant";
import { PageViewTracker } from "@/components/storefront/page-view-tracker";
import { StorefrontHeader } from "./storefront-header";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}): Promise<Metadata> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return {};

  const preset = getCategoryPreset(
    await getTenantBusinessCategorySlug(tenant.id)
  );
  const description =
    tenant.about_text?.trim() ||
    preset.heroSubtitle ||
    `Shop ${tenant.name} on vendah.`;

  return {
    title: {
      default: `${tenant.name} — Shop on vendah`,
      template: `%s · ${tenant.name}`,
    },
    description,
    alternates: { canonical: getStorefrontUrl(subdomain) },
    openGraph: {
      title: tenant.name,
      description,
      siteName: `${tenant.name} on vendah`,
      type: "website",
      url: getStorefrontUrl(subdomain),
      images: tenant.branding?.bannerUrl
        ? [{ url: tenant.branding.bannerUrl }]
        : undefined,
    },
    robots: { index: true, follow: true },
  };
}

export default async function StorefrontLayout({
  params,
  children,
}: {
  params: Promise<{ subdomain: string }>;
  children: React.ReactNode;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const preset = getCategoryPreset(
    await getTenantBusinessCategorySlug(tenant.id)
  );

  return (
    <div className="flex min-h-screen flex-col bg-cream">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <TenantTheme
        branding={tenant.branding}
        fallbackPalette={preset.palette}
      />
      {tenant.announcement && (
        <div className="bg-brand-accent px-4 py-2 text-center text-xs font-semibold text-white">
          {tenant.announcement}
        </div>
      )}
        <PageViewTracker />
        <CartDrawerProvider tenantId={tenant.id}>
        <StorefrontHeader tenant={tenant} tagline={preset.tagline} />
        <main className="flex-1">{children}</main>
        <PWAInstallPrompt />
        <StorefrontFooter tenant={tenant} />
      </CartDrawerProvider>
    </div>
  );
}

import Link from "next/link";
import type { HomepageSection } from "@/lib/homepage-sections";
import type { CategoryPreset } from "@/lib/category-presets";
import { getFeaturedProducts } from "@/lib/storefront";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import { ProductCard } from "@/app/(storefront)/[subdomain]/product-card";
import { productGridClasses } from "@/app/(storefront)/[subdomain]/storefront-grid";
import { NewsletterForm } from "./newsletter-form";

export function HomepageSections({
  sections,
  preset,
  subdomain,
}: {
  sections: HomepageSection[];
  preset?: CategoryPreset;
  subdomain: string;
}) {
  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          preset={preset}
          subdomain={subdomain}
        />
      ))}
    </>
  );
}

function SectionRenderer({
  section,
  preset,
  subdomain,
}: {
  section: HomepageSection;
  preset?: CategoryPreset;
  subdomain: string;
}) {
  switch (section.section_type) {
    case "hero":
      return <HeroSection section={section} preset={preset} subdomain={subdomain} />;
    case "featured_products":
      return <FeaturedProductsSection section={section} preset={preset} subdomain={subdomain} />;
    case "banner":
      return <BannerSection section={section} preset={preset} subdomain={subdomain} />;
    case "text":
      return <TextSection section={section} subdomain={subdomain} />;
    case "image_text":
      return <ImageTextSection section={section} subdomain={subdomain} />;
    case "newsletter":
      return <NewsletterSection section={section} preset={preset} />;
    default:
      return null;
  }
}

async function FeaturedProductsSection({
  section,
  preset,
  subdomain,
}: {
  section: HomepageSection;
  preset?: CategoryPreset;
  subdomain: string;
}) {
  const products = await getFeaturedProducts(section.tenant_id);
  if (products.length === 0) return null;

  const layout = preset?.layout ?? "default";

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {section.title && (
        <h2 className="font-heading text-2xl font-semibold text-charcoal sm:text-3xl">
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p className="mt-2 text-sm text-muted">{section.subtitle}</p>
      )}
      <div className={productGridClasses(layout, "featured")}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            tenantId={section.tenant_id}
            variant={preset?.cardStyle ?? "standard"}
          />
        ))}
      </div>
      <div className="mt-8 text-center">
        <Link
          href={resolveStorefrontHref(subdomain, "/shop")}
          className="inline-block rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
        >
          View all products
        </Link>
      </div>
    </section>
  );
}

function HeroSection({
  section,
  preset,
  subdomain,
}: {
  section: HomepageSection;
  preset?: CategoryPreset;
  subdomain: string;
}) {
  const bgColor = preset?.palette.primary ?? "#1b4332";

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: bgColor }}
    >
      {section.image_url && (
        <img
          src={section.image_url}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
      )}
      <div className="relative mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        {section.title && (
          <h1 className="font-heading text-4xl font-bold sm:text-5xl">
            {section.title}
          </h1>
        )}
        {section.subtitle && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
            {section.subtitle}
          </p>
        )}
        {section.link_url && section.link_label && (
          <Link
            href={resolveStorefrontHref(subdomain, section.link_url)}
            className="mt-8 inline-block rounded-lg bg-gold px-8 py-3.5 text-sm font-semibold text-charcoal transition duration-150 hover:bg-gold/90"
          >
            {section.link_label}
          </Link>
        )}
      </div>
    </section>
  );
}

function BannerSection({
  section,
  preset,
  subdomain,
}: {
  section: HomepageSection;
  preset?: CategoryPreset;
  subdomain: string;
}) {
  const btnBg = preset?.palette.accent ?? "#d4a017";

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-cream">
        {section.image_url && (
          <img
            src={section.image_url}
            alt=""
            className="h-64 w-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-charcoal/40 p-8 text-center text-white">
          {section.title && (
            <h2 className="font-heading text-2xl font-bold sm:text-3xl">
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p className="mt-2 max-w-lg text-sm text-white/80">
              {section.subtitle}
            </p>
          )}
          {section.link_url && section.link_label && (
            <Link
              href={resolveStorefrontHref(subdomain, section.link_url)}
              className="mt-6 inline-block rounded-lg px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:opacity-90"
              style={{ backgroundColor: btnBg }}
            >
              {section.link_label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function TextSection({
  section,
  subdomain,
}: {
  section: HomepageSection;
  subdomain: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      {section.title && (
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          {section.title}
        </h2>
      )}
      {section.subtitle && (
        <p className="mt-2 text-sm text-muted">{section.subtitle}</p>
      )}
      {section.body && (
        <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-charcoal-soft">
          {section.body}
        </div>
      )}
      {section.link_url && section.link_label && (
        <Link
          href={resolveStorefrontHref(subdomain, section.link_url)}
          className="mt-6 inline-block text-sm font-semibold text-pine underline-offset-4 hover:underline"
        >
          {section.link_label}
        </Link>
      )}
    </section>
  );
}

function ImageTextSection({
  section,
  subdomain,
}: {
  section: HomepageSection;
  subdomain: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-8 sm:grid-cols-2">
        {section.image_url && (
          <img
            src={section.image_url}
            alt={section.title ?? ""}
            className="h-64 w-full rounded-2xl object-cover"
          />
        )}
        <div className="flex flex-col justify-center">
          {section.title && (
            <h2 className="font-heading text-2xl font-semibold text-charcoal">
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p className="mt-2 text-sm text-muted">{section.subtitle}</p>
          )}
          {section.body && (
            <div className="mt-4 whitespace-pre-line text-base leading-relaxed text-charcoal-soft">
              {section.body}
            </div>
          )}
          {section.link_url && section.link_label && (
            <Link
              href={resolveStorefrontHref(subdomain, section.link_url)}
              className="mt-6 inline-block text-sm font-semibold text-pine underline-offset-4 hover:underline"
            >
              {section.link_label}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection({
  section,
  preset,
}: {
  section: HomepageSection;
  preset?: CategoryPreset;
}) {
  const btnBg = preset?.palette.accent ?? "#d4a017";

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-charcoal/10 bg-white p-8 text-center shadow-sm">
        {section.title && (
          <h2 className="font-heading text-xl font-semibold text-charcoal">
            {section.title}
          </h2>
        )}
        {section.subtitle && (
          <p className="mt-2 text-sm text-muted">{section.subtitle}</p>
        )}
        {section.body && (
          <p className="mt-2 text-sm text-charcoal-soft">{section.body}</p>
        )}
        <NewsletterForm tenantId={section.tenant_id} accentColor={btnBg} />
      </div>
    </section>
  );
}

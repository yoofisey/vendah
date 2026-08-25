import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getTenantBusinessCategorySlug,
  getTenantBySubdomain,
} from "@/lib/storefront";
import { getCategoryPreset } from "@/lib/category-presets";
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

  const title = `About ${tenant.name}`;
  const description =
    tenant.about_text?.replace(/\s+/g, " ").trim().slice(0, 160) ||
    `Learn more about ${tenant.name} — quality products, honest prices and service you can count on.`;

  return {
    title,
    description,
    alternates: { canonical: `${getStorefrontUrl(subdomain)}/about` },
    openGraph: {
      title,
      description,
      type: "website",
      url: `${getStorefrontUrl(subdomain)}/about`,
    },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const categorySlug = await getTenantBusinessCategorySlug(tenant.id);
  const preset = getCategoryPreset(categorySlug);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
        About us
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-charcoal">
        {tenant.name}
      </h1>
      <div
        aria-hidden
        className="mt-8 h-1.5 w-24 rounded-full bg-brand-accent"
      />
      <p className="mt-8 whitespace-pre-line text-base leading-relaxed text-charcoal-soft">
        {tenant.about_text?.trim() ||
          `Welcome to ${tenant.name} — a ${preset.name} shop on vendah. We care about quality, honest prices and fast service, and we hope you love shopping with us. Check our delivery page for how we get your order to you.`}
      </p>

      <div className="mt-12 grid gap-5 sm:grid-cols-3">
        {[
          {
            title: "Quality first",
            text: "Every item in our catalogue is chosen and checked before it goes live.",
          },
          {
            title: "Secure checkout",
            text: "Payments are processed securely through Paystack, including mobile money.",
          },
          {
            title: "We&apos;re here to help",
            text: "Questions about an order? Reach out via the contact page any time.",
          },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm"
          >
            <h2 className="font-heading text-lg font-semibold text-charcoal">
              {card.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {card.text}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/shop"
          className="rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
        >
          Shop the catalogue
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantBySubdomain } from "@/lib/storefront";
import { resolveStorefrontHref } from "@/lib/storefront-href";

export const dynamic = "force-dynamic";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const contact = tenant.contact_info ?? {};
  const hasPhone = contact.phone || contact.whatsapp;
  const hasEmail = contact.email;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Get in touch
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-charcoal">
        Contact {tenant.name}
      </h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {hasPhone && (
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal">
              Call or WhatsApp
            </h2>
            <p className="mt-3 text-lg font-semibold text-pine">
              {contact.phone ?? contact.whatsapp}
            </p>
            {contact.phone && contact.whatsapp && (
              <p className="mt-1 text-sm text-muted">WhatsApp: {contact.whatsapp}</p>
            )}
          </div>
        )}
        {hasEmail && (
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal">
              Email
            </h2>
            <a
              href={`mailto:${contact.email}`}
              className="mt-3 inline-block text-lg font-semibold text-pine underline-offset-4 hover:underline"
            >
              {contact.email}
            </a>
          </div>
        )}
        {contact.businessHours && (
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal">
              Business hours
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
              {contact.businessHours}
            </p>
          </div>
        )}
        {contact.deliveryNotes && (
          <div className="rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-charcoal">
              Delivery
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-charcoal-soft">
              {contact.deliveryNotes}
            </p>
          </div>
        )}
      </div>

      {!hasPhone && !hasEmail && (
        <p className="mt-10 rounded-xl border border-dashed border-charcoal/20 bg-white p-8 text-sm text-muted">
          We&apos;ll be adding our contact details here soon. In the meantime,
          you can reach us through the checkout notes or come back later.
        </p>
      )}

      <div className="mt-12">
        <Link
          href={resolveStorefrontHref(subdomain, "/faq")}
          className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
        >
          Read our FAQs →
        </Link>
      </div>
    </div>
  );
}

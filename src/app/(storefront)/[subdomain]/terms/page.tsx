import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { getTenantBySubdomain } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The rules for browsing, ordering and paying at this store on venfii.",
};

export default async function TermsPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const contact = tenant.contact_info ?? {};
  const deliveryFeeMinor = Number(tenant.delivery_fee_minor ?? 0);
  const deliveryFeeText =
    deliveryFeeMinor > 0
      ? `a flat rate of ${formatMoney(deliveryFeeMinor, "GHS")}`
      : "free within our delivery areas";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Legal
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-charcoal">
        Terms of Service
      </h1>
      <div aria-hidden className="mt-8 h-1.5 w-24 rounded-full bg-brand-accent" />

      <p className="mt-8 text-base leading-relaxed text-charcoal-soft">
        Welcome to {tenant.name}. These terms explain the rules for browsing,
        ordering and paying through our online storefront, hosted on venfii. By
        placing an order you agree to them, so please take a moment to read
        through.
      </p>

      <div className="mt-10 space-y-8">
        <Section title="1. Introduction">
          <p>
            This storefront is operated by {tenant.name} (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) on the venfii platform. By
            using this site or placing an order, you agree to these terms. If
            you do not agree, please do not place an order.
          </p>
          <p>
            We may update these terms from time to time. The version published
            on this page at the time of your order is the one that applies.
          </p>
        </Section>

        <Section title="2. Orders &amp; Payment">
          <p>
            All prices are listed in Ghana cedis (GH₵). Payment is processed
            securely through Paystack — we accept cards and mobile money. Your
            order is confirmed once payment succeeds, and we begin preparing it
            right away.
          </p>
          <p>
            In the rare case that an item sells out after you order, we will
            reach you on the phone number or email you provided to arrange a
            refund or a suitable replacement.
          </p>
        </Section>

        <Section title="3. Shipping &amp; Delivery">
          <p>
            At checkout you can choose between delivery and pickup. Delivery
            costs {deliveryFeeText}. Where you live affects timing, so we will
            confirm the expected delivery window when we receive your order.
          </p>
          <p>
            Prefer to collect your order yourself? Choose pickup at checkout
            and we will contact you to arrange a convenient time.
          </p>
          <p>
            Read more on our{" "}
            <Link
              href="/delivery"
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              delivery &amp; returns page
            </Link>
            .
          </p>
        </Section>

        <Section title="4. Returns &amp; Refunds">
          <p>
            If an item arrives damaged or is not what you ordered, contact us
            within 7 days with your order reference and a photo of the item.
            We will arrange a replacement or a refund to the payment method you
            used.
          </p>
          <p>
            Refunds are processed through Paystack and usually reflect within a
            few working days, depending on your payment provider.
          </p>
        </Section>

        <Section title="5. Privacy">
          <p>
            We collect only the information we need to fulfil your order — your
            name, contact details and delivery address. We never sell your
            personal information. Payments are handled by Paystack, so your
            card or mobile money details are never stored by us.
          </p>
          <p>
            See our full{" "}
            <Link
              href="/privacy"
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              privacy policy
            </Link>{" "}
            for details.
          </p>
        </Section>

        <Section title="6. Contact">
          <p>Questions about these terms? Get in touch with us:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            {(contact.phone || contact.whatsapp) && (
              <li>
                Phone / WhatsApp:{" "}
                <span className="font-medium text-charcoal">
                  {contact.phone ?? contact.whatsapp}
                </span>
              </li>
            )}
            {contact.email && (
              <li>
                Email:{" "}
                <a
                  href={`mailto:${contact.email}`}
                  className="font-medium text-pine underline-offset-2 hover:underline"
                >
                  {contact.email}
                </a>
              </li>
            )}
            {contact.businessHours && (
              <li>
                Business hours: {contact.businessHours}
              </li>
            )}
          </ul>
          <p>
            You can also use our{" "}
            <Link
              href="/contact"
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              contact page
            </Link>{" "}
            any time.
          </p>
        </Section>
      </div>

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href="/shop"
          className="rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
        >
          Back to shop
        </Link>
        <Link
          href="/privacy"
          className="rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
        >
          Privacy policy
        </Link>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-charcoal/10 pt-8">
      <h2 className="font-heading text-xl font-semibold text-charcoal">
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-charcoal-soft">
        {children}
      </div>
    </section>
  );
}

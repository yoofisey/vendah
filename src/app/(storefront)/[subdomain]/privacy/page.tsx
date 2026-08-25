import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantBySubdomain } from "@/lib/storefront";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How this store on vendah collects, uses and protects your information.",
};

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const contact = tenant.contact_info ?? {};

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Legal
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-charcoal">
        Privacy Policy
      </h1>
      <div aria-hidden className="mt-8 h-1.5 w-24 rounded-full bg-brand-accent" />

      <p className="mt-8 text-base leading-relaxed text-charcoal-soft">
        Your privacy matters to {tenant.name}. This policy explains what
        information we collect when you shop with us on vendah, how we use it,
        and the choices you have.
      </p>

      <div className="mt-10 space-y-8">
        <Section title="1. Information We Collect">
          <p>When you place an order, we collect:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your name</li>
            <li>Your phone number and email address</li>
            <li>Your delivery address, if you choose delivery</li>
            <li>Your order details — items, quantities and order value</li>
          </ul>
          <p>
            Payments are processed by Paystack, so your card or mobile money
            details go directly to them and are never stored by us. We also see
            basic, anonymous usage data (like which pages are visited) to keep
            the store running smoothly.
          </p>
        </Section>

        <Section title="2. How We Use Information">
          <p>We use your information to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Fulfil and deliver your orders</li>
            <li>Send order confirmations and delivery updates</li>
            <li>Provide customer support when something goes wrong</li>
            <li>Improve our products and the shopping experience</li>
          </ul>
          <p>
            We do not use your details for unrelated marketing without your
            consent.
          </p>
        </Section>

        <Section title="3. How We Share Information">
          <p>
            We share your information only with the parties needed to complete
            your order:
          </p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-medium text-charcoal">Paystack</span>, to
              process payments securely
            </li>
            <li>
              Delivery personnel or couriers, who receive your name, address
              and phone number so your parcel arrives
            </li>
            <li>
              The vendah platform, which hosts this storefront and stores order
              records on our behalf
            </li>
          </ul>
          <p>We never sell your personal information to anyone.</p>
        </Section>

        <Section title="4. Data Security">
          <p>
            Your data is transmitted over encrypted connections and stored
            securely. Access is limited to people who need it to serve you —
            for example, to pack and deliver your order. We keep order records
            only as long as needed for deliveries, refunds and honest
            bookkeeping.
          </p>
        </Section>

        <Section title="5. Cookies &amp; Local Storage">
          <p>
            This store uses local storage on your device to remember your cart
            between visits and to keep small preferences. These are used only
            to make shopping easier — we do not run third-party advertising or
            tracking cookies.
          </p>
        </Section>

        <Section title="6. Changes to This Policy">
          <p>
            If we change this policy, the updated version will be published on
            this page. Continuing to use the store after a change means you
            accept the updated policy.
          </p>
        </Section>

        <Section title="7. Contact">
          <p>
            Questions about your privacy or want your data removed? Reach out
            to us:
          </p>
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
              <li>Business hours: {contact.businessHours}</li>
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
          href="/terms"
          className="rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
        >
          Terms of Service
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

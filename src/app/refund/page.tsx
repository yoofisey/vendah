import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refund Policy — venfii",
  description: "How refunds work on venfii platform fees and for store purchases.",
};

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <Link href="/" className="text-sm font-semibold text-pine hover:underline">
          ← Back to venfii
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-semibold text-charcoal">
          Refund Policy
        </h1>
        <p className="mt-2 text-sm text-muted">
          Last updated: September 2026
        </p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-charcoal-soft">
          <Section title="1. Buying from a store on venfii">
            <p>
              When you buy from a store hosted on venfii, the sale is with that
              store&apos;s owner. Each store sets its own returns and exchange
              terms, shown at checkout or on its Delivery &amp; returns page. If
              an item is damaged, wrong or never arrives, contact the store first
              — they are responsible for resolving the order. If you cannot reach
              them, email{" "}
              <a
                href="mailto:support@venfii.com"
                className="font-medium text-pine hover:underline"
              >
                support@venfii.com
              </a>{" "}
              and we will help mediate.
            </p>
          </Section>

          <Section title="2. Paid platform plans">
            <p>
              Paid plans are billed in advance. Because the plan gives you access
              for the whole billing period, we generally do not refund partial
              months when you cancel. You can cancel at any time and no further
              charges are taken. If a charge was made in error, or if venfii
              itself fails to provide the service and that failure is our fault,
              we will refund the affected fee.
            </p>
          </Section>

          <Section title="3. Refunds to your customer">
            <p>
              If a paid order is cancelled before it is fulfilled, venfii&apos;s
              payment flow returns the money automatically so you do not have to
              chase refunds manually. Where a buyer is entitled to a refund under
              the store&apos;s own policy, the store processes it through its
              payment provider; funds normally return within a few business days
              depending on the bank or mobile money network.
            </p>
          </Section>

          <Section title="4. Contact us">
            <p>
              Questions about a refund? Reach us at{" "}
              <a
                href="mailto:support@venfii.com"
                className="font-medium text-pine hover:underline"
              >
                support@venfii.com
              </a>
              . For purchases made from a specific store, please contact that
              store directly first.
            </p>
          </Section>
        </div>
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
    <section>
      <h2 className="flex items-center gap-3 font-heading text-lg font-semibold text-charcoal">
        {title}
      </h2>
      <div className="mt-2 text-sm leading-relaxed text-charcoal-soft sm:text-base">
        {children}
      </div>
    </section>
  );
}
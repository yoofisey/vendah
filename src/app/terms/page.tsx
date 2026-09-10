import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — venfii",
  description:
    "The terms governing use of venfii and the stores hosted on it.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-20">
        <Link href="/" className="text-sm font-semibold text-pine hover:underline">
          ← Back to venfii
        </Link>
        <h1 className="mt-6 font-heading text-4xl font-semibold text-charcoal">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-muted">
          Last updated: September 2026 · Applies to use of venfii
        </p>

        <div className="mt-10 space-y-8 text-base leading-relaxed text-charcoal-soft">
          <Section title="1. Who we are">
            <p>
              venfii is a platform, operated by Venfii, that lets sellers create
              and run their own online stores. Using venfii (the
              &ldquo;Platform&rdquo;) means you agree to these terms.
            </p>
          </Section>

          <Section title="2. Accounts &amp; eligibility">
            <p>
              You must be at least 18 years old and able to form a binding
              contract to open a venfii account. You are responsible for keeping
              your login credentials safe and for everything done through your
              account. If you sell on behalf of a business, you confirm you have
              the authority to bind that business to these terms.
            </p>
          </Section>

          <Section title="3. Your store">
            <p>
              You are responsible for your store&apos;s content: products,
              descriptions, prices, images and customer communications. You must
              not list products that are illegal, counterfeit, stolen or that you
              have no right to sell, and you must meet any age or labelling
              requirements that apply to your products. You agree to provide
              accurate contact details so your customers can reach you.
            </p>
          </Section>

          <Section title="4. Orders, payments &amp; payouts">
            <p>
              Orders placed in your store are contracts between you and your
              customer. Payments are processed by Paystack, which passes money
              through to you in line with Paystack&apos;s terms. Payout timing
              depends on Paystack and your own bank or mobile money provider.
              You authorise Paystack to settle funds directly to the account you
              provide and you keep your payout details accurate and up to date.
            </p>
          </Section>

          <Section title="5. Fees &amp; paid plans">
            <p>
              The Free plan carries a commission per sale at the rate shown on
              our pricing page. Paid plans are billed monthly or annually in
              advance and do not carry a sales commission. Fees are non-refundable
              except where required by law or where we cancel the service for our
              own fault. We may change prices with notice; changes take effect at
              your next billing cycle.
            </p>
          </Section>

          <Section title="6. Acceptable use">
            <p>
              You must not use the Platform to send spam, commit fraud, launder
              money, or attempt to access other users&apos; accounts or our
              systems without permission. We may suspend or close accounts that
              breach these rules, and may hold funds where fraud is suspected.
            </p>
          </Section>

          <Section title="7. Intellectual property">
            <p>
              You keep all rights to your content. venfii (including its name,
              logo and the styling of the Platform) is owned by Venfii. On the
              Free plan, a &ldquo;Powered by venfii&rdquo; footer is shown on
              your storefront.
            </p>
          </Section>

          <Section title="8. Our responsibility">
            <p>
              We provide the Platform &ldquo;as is&rdquo; and make no promises
              about uninterrupted or error-free service, except where the law
              does not allow us to limit these. To the fullest extent permitted
              by law, venfii is not liable for indirect or consequential loss,
              or for losses caused by events outside our reasonable control.
            </p>
          </Section>

          <Section title="9. Ending your account">
            <p>
              You can close your account at any time from the dashboard. Closed
              accounts stop incurring fees immediately and no further charges are
              taken. Any amounts already due remain payable.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Questions about these terms? Contact us at{" "}
              <a
                href="mailto:support@venfii.com"
                className="font-medium text-pine hover:underline"
              >
                support@venfii.com
              </a>
              .
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
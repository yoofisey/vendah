import { notFound } from "next/navigation";
import Link from "next/link";
import { getTenantBySubdomain } from "@/lib/storefront";

export const dynamic = "force-dynamic";

const FAQS = [
  {
    q: "How do I place an order?",
    a: "Browse the catalogue, pick your items and tap Add to cart. Then go to checkout, enter your name, phone and email, choose pickup or delivery, and pay securely with card or mobile money.",
  },
  {
    q: "Which payment methods do you accept?",
    a: "All orders are paid securely through Paystack. You can pay with Visa or Mastercard, or mobile money (MTN Mobile Money, Vodafone Cash and AirtelTigo Money).",
  },
  {
    q: "Can I change or cancel my order?",
    a: "Contact us as soon as possible with your order reference. If your order hasn't been processed yet we'll do our best to change it or cancel and refund it.",
  },
  {
    q: "How do I track my order?",
    a: "Use the Track your order page with your order reference and the phone number or email you used at checkout. Your order moves through Paid, Processing, Shipped and Delivered.",
  },
  {
    q: "Do you deliver, or can I pick up?",
    a: "Both. At checkout you can choose delivery or pickup. Check the Delivery & returns page for details, fees and areas we cover.",
  },
  {
    q: "What if an item is out of stock?",
    a: "If an item is out of stock we show it as Sold out and you won't be able to add it to your cart. If a paid item turns out to be unavailable, we'll contact you to arrange a swap or a refund.",
  },
];

export default async function FaqPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Help
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-charcoal">
        Frequently asked questions
      </h1>

      <div className="mt-10 divide-y divide-charcoal/10 border-y border-charcoal/10">
        {FAQS.map((faq) => (
          <details key={faq.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-charcoal transition duration-150 group-hover:text-pine">
              {faq.q}
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-charcoal/15 text-lg text-muted transition duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted">{faq.a}</p>
          </details>
        ))}
      </div>

      <p className="mt-10 text-sm text-muted">
        Still need help?{" "}
        <Link
          href="/contact"
          className="font-semibold text-pine underline-offset-4 hover:underline"
        >
          Contact {tenant.name}
        </Link>{" "}
        with your order reference.
      </p>
    </div>
  );
}

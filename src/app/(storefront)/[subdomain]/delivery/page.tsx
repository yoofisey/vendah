import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronDownIcon,
  ClockIcon,
  EnvelopeIcon,
  PhoneIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "@heroicons/react/24/outline";
import { formatMoney } from "@/lib/format";
import { getTenantBySubdomain } from "@/lib/storefront";
import { resolveStorefrontHref } from "@/lib/storefront-href";

export const dynamic = "force-dynamic";

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const contact = tenant.contact_info ?? {};
  const notes = contact.deliveryNotes;
  const deliveryFeeMinor = Number(tenant.delivery_fee_minor ?? 0);
  const feeText =
    deliveryFeeMinor > 0
      ? formatMoney(deliveryFeeMinor, "GHS")
      : "Free";

  const faqs = [
    {
      question: "How long does delivery take?",
      answer:
        notes
          ? "It depends on your location — see our delivery notes above for the areas we cover and typical timing. We confirm the exact window when your order comes in."
          : "We prepare orders as quickly as we can and will confirm the expected delivery window when your order comes in.",
    },
    {
      question: "How much does delivery cost?",
      answer:
        deliveryFeeMinor > 0
          ? `Delivery is a flat rate of ${formatMoney(
              deliveryFeeMinor,
              "GHS"
            )} per order, shown at checkout before you pay.`
          : "Delivery is currently free within our delivery areas — you only pay for your items.",
    },
    {
      question: "Can I collect my order instead?",
      answer:
        "Yes! Choose pickup at checkout and we'll be in touch to arrange a convenient time. Bring your order reference when you come.",
    },
    {
      question: "What if I'm not home when you deliver?",
      answer:
        "We'll call the phone number you provided at checkout to coordinate. If we can't reach you, we'll agree on another time or a safe drop-off spot.",
    },
    {
      question: "What happens if my order arrives damaged?",
      answer:
        "Contact us within 7 days with your order reference and a photo of the item. We'll arrange a replacement or a refund to the payment method you used.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-dark">
        Shipping
      </p>
      <h1 className="mt-3 font-heading text-4xl font-semibold text-charcoal">
        Delivery &amp; returns
      </h1>

      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <section className="flex flex-col rounded-2xl border border-charcoal/10 bg-white p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-pine/10 text-pine">
            <TruckIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold text-charcoal">
            Delivery
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-charcoal-soft">
            {notes ? (
              <span className="block whitespace-pre-line">{notes}</span>
            ) : (
              <span className="block">
                At checkout you can choose delivery and we&apos;ll bring your
                order to your door.
              </span>
            )}
          </p>
          <p className="mt-3 text-sm font-medium text-pine">
            Delivery fee: {feeText}
          </p>
        </section>

        <section className="flex flex-col rounded-2xl border border-charcoal/10 bg-white p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
            <ShoppingBagIcon className="h-5 w-5" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold text-charcoal">
            Pickup
          </h2>
          <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
            Prefer to collect in person? Choose pickup at checkout and
            we&apos;ll be in touch to arrange a time. Bring your order reference
            when you come.
          </p>
          <p className="mt-3 text-sm font-medium text-pine">Pickup fee: Free</p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-charcoal/10 bg-white p-7 shadow-sm">
        <h2 className="font-heading text-xl font-semibold text-charcoal">
          Returns &amp; refunds
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
          If an item arrives damaged or isn&apos;t what you ordered, contact us
          within 7 days with your order reference and a photo. We&apos;ll arrange a
          replacement or a refund to the payment method you used. Refunds are
          processed through Paystack and usually reflect within a few working
          days.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-heading text-2xl font-semibold text-charcoal">
          Shipping FAQs
        </h2>
        <div className="mt-6 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-xl border border-charcoal/10 bg-white px-5 py-4 shadow-sm [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-charcoal">
                {faq.question}
                <ChevronDownIcon className="h-4 w-4 shrink-0 text-charcoal-mute transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-charcoal-soft">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {(contact.phone || contact.whatsapp || contact.email || contact.businessHours) && (
        <section className="mt-12 rounded-2xl border border-charcoal/10 bg-white p-7 shadow-sm">
          <h2 className="font-heading text-xl font-semibold text-charcoal">
            Questions about your delivery?
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {(contact.phone || contact.whatsapp) && (
              <li className="flex items-center gap-2">
                <PhoneIcon className="h-4 w-4 shrink-0 text-charcoal-mute" />
                <a
                  href={`tel:${(contact.phone ?? contact.whatsapp ?? "").replace(/\s+/g, "")}`}
                  className="font-medium text-pine underline-offset-2 hover:underline"
                >
                  {contact.phone ?? contact.whatsapp}
                </a>
              </li>
            )}
            {contact.email && (
              <li className="flex items-center gap-2">
                <EnvelopeIcon className="h-4 w-4 shrink-0 text-charcoal-mute" />
                <a
                  href={`mailto:${contact.email}`}
                  className="font-medium text-pine underline-offset-2 hover:underline"
                >
                  {contact.email}
                </a>
              </li>
            )}
            {contact.businessHours && (
              <li className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 shrink-0 text-charcoal-mute" />
                {contact.businessHours}
              </li>
            )}
          </ul>
        </section>
      )}

      <div className="mt-12 flex flex-wrap gap-4">
        <Link
          href={resolveStorefrontHref(subdomain, "/shop")}
          className="rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
        >
          Back to shop
        </Link>
        <Link
          href={resolveStorefrontHref(subdomain, "/contact")}
          className="rounded-lg border border-charcoal/15 bg-white px-6 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:border-pine hover:text-pine"
        >
          Contact us
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

const FAQS = [
  {
    q: "How do I add products?",
    a: "Go to Products → Click \"Add Product\" in the top right.",
  },
  {
    q: "How do I accept payments?",
    a: "Go to Settings → Payment Account → Connect Paystack.",
  },
  {
    q: "How do I customize my store?",
    a: "Go to Settings → Branding & Design.",
  },
  {
    q: "How do I set up delivery?",
    a: "Go to Settings → Delivery & Shipping.",
  },
  {
    q: "How do I create discount codes?",
    a: "Go to Discounts → Create Code.",
  },
  {
    q: "How do I view my orders?",
    a: "Go to Orders from the sidebar.",
  },
  {
    q: "How do I contact support?",
    a: "Email support@venfii.com",
  },
  {
    q: "What are the plan features?",
    a: "See the Billing page for a full plan comparison.",
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <h1 className="font-heading text-2xl font-semibold text-charcoal">
        Help &amp; FAQ
      </h1>
      <p className="mt-2 text-sm text-muted">
        Answers to common questions about running your store.
      </p>

      <div className="mt-8 divide-y divide-charcoal/10 rounded-2xl border border-charcoal/10 bg-white">
        {FAQS.map((faq, i) => (
          <button
            key={i}
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left transition duration-150 hover:bg-cream/60"
          >
            <span className="text-sm font-medium text-charcoal">
              {faq.q}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-muted transition duration-200 ${
                open === i ? "rotate-180" : ""
              }`}
            />
          </button>
        ))}
        {FAQS.map((faq, i) =>
          open === i ? (
            <div key={`a-${i}`} className="px-6 pb-5 pt-1 text-sm leading-relaxed text-charcoal-soft">
              {faq.a}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}

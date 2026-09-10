"use client";

import { useState } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { PLANS } from "@/lib/plans";
import { AuthTrigger } from "@/components/auth-trigger";
import { ScrollReveal } from "@/components/scroll-reveal";

export function PricingSection() {
  const [annual, setAnnual] = useState(false);

  return (
    <section className="border-t border-charcoal/5 bg-white px-5 py-16 sm:px-8 sm:py-20">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal direction="up">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
              Simple pricing
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-charcoal sm:text-4xl">
              Start free, upgrade when you&apos;re ready
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted">
              No hidden fees. Pay only when you grow.
            </p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-charcoal/10 bg-cream/60 p-1.5">
              <button
                type="button"
                onClick={() => setAnnual(false)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition duration-150 ${
                  !annual ? "bg-pine text-white shadow" : "text-charcoal-soft hover:text-charcoal"
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setAnnual(true)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition duration-150 ${
                  annual ? "bg-pine text-white shadow" : "text-charcoal-soft hover:text-charcoal"
                }`}
              >
                Annual{" "}
                <span className="ml-0.5 text-xs font-bold text-gold-dark">
                  save 2 months
                </span>
              </button>
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(PLANS).map(([id, plan], i) => (
            <ScrollReveal key={id} direction="up" delay={i * 100}>
              <PricingCard
                planId={id}
                name={plan.name}
                monthlyPrice={plan.monthlyGhs}
                annualPrice={plan.annualGhs}
                productLimit={
                  plan.productLimit === null
                    ? "Unlimited products"
                    : `${plan.productLimit} products`
                }
                fee={
                  plan.salesFeePct > 0
                    ? `${plan.salesFeePct}% per sale`
                    : "0% per sale"
                }
                features={plan.features}
                annual={annual}
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  planId,
  name,
  monthlyPrice,
  annualPrice,
  productLimit,
  fee,
  features,
  annual,
}: {
  planId: string;
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  productLimit: string;
  fee: string;
  features: string[];
  annual: boolean;
}) {
  const highlighted = planId === "starter";
  const effectiveMonthly =
    annual && annualPrice > 0 ? Math.round(annualPrice / 10) : monthlyPrice;

  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-xl border p-6 transition duration-200 hover:-translate-y-0.5 ${
        highlighted
          ? "border-pine/30 bg-pine text-white shadow-lg shadow-pine/20"
          : "border-white/70 bg-cream/60 hover:border-pine/20 hover:bg-white hover:shadow-[0_16px_40px_-24px_rgba(27,67,50,0.2)]"
      }`}
    >
      {highlighted && (
        <span className="absolute right-4 top-4 rounded-full bg-gold px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-charcoal">
          Popular
        </span>
      )}
      <h3
        className={`font-heading text-xl font-semibold ${highlighted ? "text-white" : "text-charcoal"}`}
      >
        {name}
      </h3>
      <div className="mt-4">
        {annual && annualPrice > 0 && (
          <span
            className={`text-xs ${highlighted ? "text-white/70" : "text-muted"}`}
          >
            ₵{annualPrice.toLocaleString()} / year · ₵
            {Math.round(annualPrice / 10).toLocaleString()} / month
          </span>
        )}
        <div className="flex items-baseline gap-1">
          <span
            className={`font-heading text-3xl font-semibold ${
              highlighted ? "text-white" : "text-charcoal"
            }`}
          >
            {effectiveMonthly === 0 ? "Free" : `₵${effectiveMonthly}`}
          </span>
          {effectiveMonthly > 0 && (
            <span
              className={`text-sm ${highlighted ? "text-white/70" : "text-muted"}`}
            >
              /month{annual ? " · billed yearly" : ""}
            </span>
          )}
        </div>
      </div>

      {!annual && effectiveMonthly > 0 && annualPrice > 0 && (
        <p
          className={`mt-1 text-xs ${
            highlighted ? "text-white/70" : "text-muted"
          }`}
        >
          or ₵{annualPrice.toLocaleString()}/yr — save 2 months
        </p>
      )}

      <div className="mt-6 flex-1 space-y-2.5">
        <PricingFeature text={productLimit} muted={highlighted} />
        <PricingFeature text={fee} muted={highlighted} />
        {features.map((feature) => (
          <PricingFeature key={feature} text={feature} muted={highlighted} />
        ))}
      </div>
      <AuthTrigger
        mode="signup"
        className={`mt-7 block w-full rounded-lg py-3 text-center text-sm font-semibold transition duration-200 ${
          highlighted
            ? "bg-white text-pine hover:bg-cream"
            : "bg-pine text-white hover:bg-pine-dark"
        }`}
      >
        Get started
      </AuthTrigger>
    </div>
  );
}

function PricingFeature({ text, muted }: { text: string; muted: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <SparklesIcon
        className={`mt-0.5 h-4 w-4 shrink-0 ${muted ? "text-gold-light" : "text-gold"}`}
      />
      <span
        className={`text-sm leading-snug ${muted ? "text-white/80" : "text-charcoal-soft"}`}
      >
        {text}
      </span>
    </div>
  );
}
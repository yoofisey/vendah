"use client";

import { useEffect, useState, useActionState } from "react";
import { useRouter } from "next/navigation";
import { changePlan } from "./actions";
import { PLANS } from "@/lib/plans";
import type { BillingCycle, SubscriptionTier } from "@/lib/types";

const PLANS_LIST: {
  id: SubscriptionTier;
  name: string;
  blurb: string;
  features: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    blurb: "Launch your shop at no cost.",
    features: ["6% charge on sales", "Up to 20 products", "Powered by vendah footer"],
  },
  {
    id: "starter",
    name: "Starter",
    blurb: "For getting your first online shop live.",
    features: ["Up to 40 products", "No charge on sales", "Branded storefront"],
  },
  {
    id: "growth",
    name: "Growth",
    blurb: "For shops ready to sell more, faster.",
    features: ["Up to 80 products", "No charge on sales", "WhatsApp catalogue sync", "Mobile money reconciliation"],
  },
  {
    id: "industry",
    name: "Industry",
    blurb: "Maximum scale for established brands.",
    features: ["Unlimited products", "No charge on sales", "Custom domain", "Priority support"],
  },
];

export function PlanManager({
  currentTier,
  currentCycle,
  periodEnd,
  subStatus,
}: {
  currentTier: SubscriptionTier;
  currentCycle: BillingCycle;
  periodEnd: string | null;
  subStatus: string | null;
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(changePlan, {});
  const [tier, setTier] = useState<SubscriptionTier>(currentTier);
  const [cycle, setCycle] = useState<BillingCycle>(currentCycle);

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  const statusLabel: Record<string, string> = {
    active: "Active",
    trialing: "Awaiting payment",
    past_due: "Past due",
    paused: "Paused",
    cancelled: "Cancelled",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{PLANS[currentTier].name}</p>
          <p className="mt-1 text-sm text-muted">
            {PLANS[currentTier].name} ·{" "}
            {currentTier === "free"
              ? "no subscription fee"
              : cycleAmountLabel(currentTier, currentCycle)}
            {periodEnd && (
              <> · renews {new Date(periodEnd).toLocaleDateString()}</>
            )}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            subStatus === "active"
              ? "bg-emerald-100 text-emerald-700"
              : subStatus === "past_due"
                ? "bg-red-100 text-red-700"
                : subStatus === "trialing"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-gray-100 text-gray-600"
          }`}
        >
          {subStatus ? (statusLabel[subStatus] ?? subStatus) : "Active"}
        </span>
      </div>

      <form action={action} className="space-y-5">
        <input type="hidden" name="tier" value={tier} />
        <input type="hidden" name="billingCycle" value={cycle} />

        {tier !== "free" && (
          <div className="inline-flex rounded-lg border border-charcoal/10 bg-cream p-1">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCycle(option)}
                className={`rounded-md px-4 py-1.5 text-sm font-medium capitalize transition ${
                  cycle === option
                    ? "bg-white text-charcoal shadow-sm"
                    : "text-muted hover:text-charcoal"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {PLANS_LIST.map((plan) => (
            <label
              key={plan.id}
              className={`flex cursor-pointer flex-col gap-2 rounded-xl border-2 p-5 transition duration-200 has-[:checked]:border-gold has-[:checked]:bg-gold/[0.06] has-[:checked]:shadow-md ${
                tier === plan.id ? "" : "border-charcoal/10"
              }`}
            >
              <input
                type="radio"
                checked={tier === plan.id}
                onChange={() => setTier(plan.id)}
                className="sr-only"
              />
              <div className="flex items-baseline justify-between">
                <span className="font-heading text-base font-semibold text-charcoal">
                  {plan.name}
                </span>
                <span className="text-sm font-medium text-muted">
                  {plan.id === "free"
                    ? "Free"
                    : cycle === "monthly"
                      ? `₵${PLANS[plan.id].monthlyGhs}/mo`
                      : `₵${PLANS[plan.id].annualGhs}/yr`}
                </span>
              </div>
              <p className="text-xs text-muted">{plan.blurb}</p>
              <ul className="mt-2 space-y-1 text-sm text-charcoal-soft">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-gold" aria-hidden>✓</span> {f}
                  </li>
                ))}
              </ul>
            </label>
          ))}
        </div>

        {state.error && (
          <p className="text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending || (tier === currentTier && cycle === currentCycle)}
          className="w-full rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-200 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {pending
            ? "Please wait…"
            : tier === "free"
              ? "Switch to Free"
              : tier === currentTier
                ? `Switch to ${cycle} billing`
                : `Switch to ${PLANS[tier].name} · pay now`}
        </button>
      </form>
    </div>
  );
}

function cycleAmountLabel(tier: SubscriptionTier, cycle: BillingCycle): string {
  const plan = PLANS[tier];
  return cycle === "annual" ? `₵${plan.annualGhs}/yr` : `₵${plan.monthlyGhs}/mo`;
}

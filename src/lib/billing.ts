import "server-only";

import { PLANS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  cancelPaystackSubscription,
  changePaystackSubscriptionPlan,
  ensurePaystackPlan,
  updatePaystackSubaccountPercentage,
} from "@/lib/paystack";
import type { BillingCycle, SubscriptionTier } from "@/lib/types";

export const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vendah.com";

export const APEX_ORIGIN =
  APP_DOMAIN === "localhost"
    ? "http://localhost:3000"
    : `https://${APP_DOMAIN}`;

export type SubscriptionRow = {
  id: string;
  tenant_id: string;
  tier: SubscriptionTier;
  status: "trialing" | "active" | "past_due" | "cancelled" | "paused";
  billing_cycle: BillingCycle;
  provider_subscription_id: string | null;
  provider_customer_id: string | null;
  provider_customer_email: string | null;
  product_limit: number | null;
  sales_fee_pct: number;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
};

export function planCodeFor(tier: SubscriptionTier, cycle: BillingCycle): string {
  return `vendah-${tier}-${cycle === "monthly" ? "m" : "y"}`;
}

export function planTierFromCode(code: string): SubscriptionTier | null {
  const match = code.match(/^vendah-(free|starter|growth|industry)-(m|y)$/);
  return match ? (match[1] as SubscriptionTier) : null;
}

export function planCycleFromCode(code: string): BillingCycle | null {
  const match = code.match(/^vendah-(?:free|starter|growth|industry)-(m|y)$/);
  return match ? (match[1] === "y" ? "annual" : "monthly") : null;
}

export function cycleAmountMinor(
  tier: SubscriptionTier,
  cycle: BillingCycle
): number {
  const plan = PLANS[tier];
  return (cycle === "annual" ? plan.annualGhs : plan.monthlyGhs) * 100;
}

export function cycleName(cycle: BillingCycle): string {
  return cycle === "annual" ? "annually" : "monthly";
}

function addPeriod(start: Date, cycle: BillingCycle): Date {
  const end = new Date(start);
  if (cycle === "annual") end.setFullYear(end.getFullYear() + 1);
  else end.setMonth(end.getMonth() + 1);
  return end;
}

export async function ensureBillingPlan(
  tier: SubscriptionTier,
  cycle: BillingCycle
): Promise<string> {
  const plan = PLANS[tier];
  return ensurePaystackPlan({
    name: `vendah ${plan.name} (${cycleName(cycle)})`,
    planCode: planCodeFor(tier, cycle),
    amountMinor: cycleAmountMinor(tier, cycle),
    interval: cycle === "annual" ? "annually" : "monthly",
  });
}

type VerifiedSubscriptionPayment = {
  status: string;
  reference: string;
  amount: number;
  paid_at?: string;
  subscription_code?: string;
  customer?: { customer_code?: string; email?: string };
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};

export async function activateSubscriptionFromPayment(
  data: VerifiedSubscriptionPayment
): Promise<boolean> {
  const meta = (data.metadata ?? {}) as {
    purpose?: string;
    tenant_id?: string;
    tier?: SubscriptionTier;
    billing_cycle?: BillingCycle;
  };
  if (meta.purpose !== "subscription" || !meta.tenant_id) return false;
  const tier = meta.tier;
  const cycle = meta.billing_cycle ?? "monthly";
  if (!tier || !(tier in PLANS) || (cycle !== "monthly" && cycle !== "annual")) {
    return false;
  }
  if (Number(data.amount) !== cycleAmountMinor(tier, cycle)) return false;

  const plan = PLANS[tier];
  const now = new Date();
  const periodStart = data.paid_at ? new Date(data.paid_at) : now;

  const admin = createAdminClient();
  await admin
    .from("tenants")
    .update({
      status: "active",
      subscription_tier: tier,
      updated_at: now.toISOString(),
    })
    .eq("id", meta.tenant_id);

  await admin
    .from("subscriptions")
    .upsert(
      {
        tenant_id: meta.tenant_id,
        tier,
        status: "active",
        billing_cycle: cycle,
        product_limit: plan.productLimit,
        sales_fee_pct: plan.salesFeePct,
        provider_subscription_id: data.subscription_code ?? null,
        provider_customer_id: data.customer?.customer_code ?? null,
        provider_customer_email: data.customer?.email ?? null,
        current_period_start: periodStart.toISOString(),
        current_period_end: addPeriod(periodStart, cycle).toISOString(),
      },
      { onConflict: "tenant_id" }
    );

  if (typeof data.reference === "string") {
    await admin
      .from("transactions")
      .update({
        status: "success",
        updated_at: now.toISOString(),
      })
      .eq("provider", "paystack")
      .eq("provider_reference", data.reference);
  }
  return true;
}

export async function markSubscriptionPastDue(tenantId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("tenant_id", tenantId);
}

export async function handleSubscriptionDisabled(eventData: {
  subscription_code?: string;
  customer?: { email?: string };
}): Promise<void> {
  const admin = createAdminClient();
  const code = eventData.subscription_code;
  const email = eventData.customer?.email;
  if (!code && !email) return;
  const query = code
    ? admin.from("subscriptions").select("id").eq("provider_subscription_id", code)
    : admin.from("subscriptions").select("id").eq("provider_customer_email", email);
  const { data: sub } = await query.maybeSingle();
  if (sub?.id) {
    await admin
      .from("subscriptions")
      .update({ status: "paused", updated_at: new Date().toISOString() })
      .eq("id", sub.id);
  }
}

export async function handleInvoiceCreated(eventData: {
  subscription?: {
    subscription_code?: string;
    customer?: { email?: string };
    plan?: { plan_code?: string };
    status?: string;
  };
  period_start?: string;
  period_end?: string;
}): Promise<void> {
  const code = eventData.subscription?.subscription_code;
  const email = eventData.subscription?.customer?.email;
  const planCode = eventData.subscription?.plan?.plan_code;
  if (!code && !email) return;
  const admin = createAdminClient();
  let query = admin.from("subscriptions").select("*").limit(1);
  if (code) {
    query = admin.from("subscriptions").select("*").eq("provider_subscription_id", code);
  } else if (email) {
    query = admin.from("subscriptions").select("*").eq("provider_customer_email", email);
  }
  const { data: sub } = await query.maybeSingle();
  if (!sub?.id) return;

  const tier = planCode ? planTierFromCode(planCode) : null;
  const cycle = planCode ? planCycleFromCode(planCode) : null;
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (eventData.period_start) updates.current_period_start = eventData.period_start;
  if (eventData.period_end) updates.current_period_end = eventData.period_end;
  if (eventData.subscription?.status === "active") updates.status = "active";
  if (tier && tier !== sub.tier) updates.tier = tier;
  if (cycle && cycle !== sub.billing_cycle) updates.billing_cycle = cycle;
  if (tier && tier in PLANS) {
    const plan = PLANS[tier];
    updates.product_limit = plan.productLimit;
    updates.sales_fee_pct = plan.salesFeePct;
  }
  await admin.from("subscriptions").update(updates).eq("id", sub.id);
}

export function isSubscriptionExpired(sub: SubscriptionRow): boolean {
  if (sub.tier === "free") return false;
  if (!sub.current_period_end) return true;
  return new Date(sub.current_period_end).getTime() + GRACE_PERIOD_MS < Date.now();
}

export async function downgradeToFree(
  tenantId: string,
  providerSubscriptionId?: string | null,
  paystackSubaccountCode?: string | null
): Promise<void> {
  const plan = PLANS.free;
  const admin = createAdminClient();

  if (providerSubscriptionId) {
    try {
      await cancelPaystackSubscription(providerSubscriptionId);
    } catch {
      // best effort
    }
  }
  if (paystackSubaccountCode) {
    try {
      await updatePaystackSubaccountPercentage(paystackSubaccountCode, plan.salesFeePct);
    } catch {
      // best effort
    }
  }

  await admin
    .from("tenants")
    .update({
      subscription_tier: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  await admin
    .from("subscriptions")
    .upsert(
      {
        tenant_id: tenantId,
        tier: "free",
        status: "active",
        billing_cycle: "monthly",
        product_limit: plan.productLimit,
        sales_fee_pct: plan.salesFeePct,
        provider_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
      },
      { onConflict: "tenant_id" }
    );
}

export async function syncSubaccountPercentage(
  tenantId: string,
  tier: SubscriptionTier,
  subaccountCode: string | null
): Promise<void> {
  if (!subaccountCode) return;
  try {
    await updatePaystackSubaccountPercentage(subaccountCode, PLANS[tier].salesFeePct);
  } catch {
    // best effort
  }
}

export async function applyPlanSwitch(
  tenantId: string,
  tier: SubscriptionTier,
  cycle: BillingCycle,
  subscription: SubscriptionRow | null
): Promise<void> {
  const plan = PLANS[tier];
  const admin = createAdminClient();

  await admin
    .from("tenants")
    .update({
      subscription_tier: tier,
      updated_at: new Date().toISOString(),
    })
    .eq("id", tenantId);

  await admin
    .from("subscriptions")
    .upsert(
      {
        tenant_id: tenantId,
        tier,
        status: subscription?.status === "active" ? "active" : "trialing",
        billing_cycle: cycle,
        product_limit: plan.productLimit,
        sales_fee_pct: plan.salesFeePct,
        current_period_start: subscription?.current_period_start ?? null,
        current_period_end: subscription?.current_period_end ?? null,
      },
      { onConflict: "tenant_id" }
    );

  if (subscription?.provider_subscription_id && subscription.status === "active") {
    try {
      const planCode = await ensureBillingPlan(tier, cycle);
      await changePaystackSubscriptionPlan(
        subscription.provider_subscription_id,
        planCode
      );
    } catch {
      // best effort; DB already reflects the new plan
    }
  }
}

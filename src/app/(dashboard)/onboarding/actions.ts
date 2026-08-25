"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { getCategoryPreset } from "@/lib/category-presets";
import {
  APEX_ORIGIN,
  cycleAmountMinor,
  ensureBillingPlan,
} from "@/lib/billing";
import { PLANS } from "@/lib/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { initializePaystackCharge } from "@/lib/paystack";
import {
  isValidSubdomain,
  normalizeSubdomain,
  RESERVED_SUBDOMAINS,
  slugify,
} from "@/lib/tenant";
import type { BillingCycle, TenantBranding } from "@/lib/types";

export type ActionState = { error?: string; success?: boolean };

export async function saveBasics(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const name = String(formData.get("name") ?? "").trim();
  const primaryId = String(formData.get("businessCategory") ?? "");
  if (name.length < 2) return { error: "Enter your shop name." };
  if (!primaryId) return { error: "Select at least one business category." };

  const allIds = formData
    .getAll("businessCategories")
    .map(String)
    .filter(Boolean);
  if (!allIds.includes(primaryId)) allIds.unshift(primaryId);

  const admin = createAdminClient();
  const slug = await uniqueSlug(name);

  const { data: category } = await admin
    .from("business_categories")
    .select("slug")
    .eq("id", primaryId)
    .maybeSingle();
  const preset = getCategoryPreset(category?.slug);

  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await admin
      .from("tenants")
      .update({
        name,
        business_category_id: primaryId,
        business_category_ids: allIds,
      })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await admin.from("tenants").insert({
      owner_id: user.id,
      name,
      slug,
      business_category_id: primaryId,
      business_category_ids: allIds,
      status: "onboarding",
      subscription_tier: "free",
      branding: {
        primaryColor: preset.palette.primary,
        accentColor: preset.palette.accent,
      },
    });
    if (error) return { error: error.message };
  }

  return { success: true };
}

export async function saveBranding(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const branding: TenantBranding = {
    logoUrl: String(formData.get("logoUrl") ?? "").trim() || undefined,
    bannerUrl: String(formData.get("bannerUrl") ?? "").trim() || undefined,
    primaryColor:
      String(formData.get("primaryColor") ?? "").trim() || undefined,
    accentColor:
      String(formData.get("accentColor") ?? "").trim() || undefined,
  };

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({ branding })
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  return { success: true };
}

export async function checkSubdomain(subdomain: string) {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized || !isValidSubdomain(normalized)) {
    return {
      available: false,
      normalized,
      error: "Use letters, numbers and hyphens only.",
    };
  }
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { available: false, normalized, error: "That name is reserved." };
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("id")
    .eq("subdomain", normalized)
    .maybeSingle();

  return { available: !data, normalized };
}

export async function claimSubdomain(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const input = String(formData.get("subdomain") ?? "");

  const normalized = normalizeSubdomain(input);
  if (!normalized || !isValidSubdomain(normalized)) {
    return { error: "That subdomain isn't valid. Use letters, numbers, hyphens." };
  }
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { error: "That subdomain is reserved." };
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("subdomain", normalized)
    .maybeSingle();

  if (existing) {
    const { data: mine } = await admin
      .from("tenants")
      .select("id")
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!mine || mine.id !== existing.id) {
      return { error: "That subdomain is already taken." };
    }
  }

  const { error } = await admin
    .from("tenants")
    .update({ subdomain: normalized, slug: normalized })
    .eq("owner_id", user.id);
  if (error) return { error: error.message };

  return { success: true };
}

export async function completeOnboarding(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const tier = z
    .enum(["free", "starter", "growth", "industry"])
    .safeParse(formData.get("tier"));
  if (!tier.success) return { error: "Select a plan." };
  const cycle = z
    .enum(["monthly", "annual"])
    .safeParse(formData.get("billingCycle"));
  if (tier.data !== "free" && !cycle.success) {
    return { error: "Choose a billing cycle." };
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, subdomain, status")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!tenant) return { error: "No shop found. Restart onboarding." };
  if (!tenant.subdomain) {
    return { error: "Claim your subdomain before finishing." };
  }

  const plan = PLANS[tier.data];

  if (tier.data === "free") {
    const now = new Date().toISOString();
    const { error: tenantError } = await admin
      .from("tenants")
      .update({ status: "active", subscription_tier: "free" })
      .eq("id", tenant.id);
    if (tenantError) return { error: tenantError.message };

    const { error: subError } = await admin.from("subscriptions").upsert(
      {
        tenant_id: tenant.id,
        tier: "free",
        status: "active",
        billing_cycle: "monthly",
        product_limit: plan.productLimit,
        sales_fee_pct: plan.salesFeePct,
        current_period_start: now,
      },
      { onConflict: "tenant_id" }
    );
    if (subError) return { error: subError.message };

    redirect("/dashboard?just-finished=1");
  }

  // Paid plan: set up an auto-renewing Paystack subscription.
  const billingCycle: BillingCycle = cycle.data ?? "monthly";
  const now = new Date().toISOString();

  const { error: subError } = await admin.from("subscriptions").upsert(
    {
      tenant_id: tenant.id,
      tier: tier.data,
      status: "trialing",
      billing_cycle: billingCycle,
      product_limit: plan.productLimit,
      sales_fee_pct: plan.salesFeePct,
      provider_customer_email: user.email ?? null,
      current_period_start: now,
    },
    { onConflict: "tenant_id" }
  );
  if (subError) return { error: subError.message };

  const reference = `SUB-${crypto.randomUUID()}`;
  const { error: txError } = await admin.from("transactions").insert({
    tenant_id: tenant.id,
    provider: "paystack",
    provider_reference: reference,
    amount_minor: cycleAmountMinor(tier.data, billingCycle),
    currency: "GHS",
    status: "initiated",
    payload: {
      purpose: "subscription",
      tier: tier.data,
      billing_cycle: billingCycle,
    },
  });
  if (txError) return { error: txError.message };

  try {
    const planCode = await ensureBillingPlan(tier.data, billingCycle);
    const { authorization_url } = await initializePaystackCharge({
      email: user.email ?? "",
      amountMinor: cycleAmountMinor(tier.data, billingCycle),
      reference,
      plan: planCode,
      callbackUrl: `${APEX_ORIGIN}/onboarding?paid=pending`,
      metadata: {
        purpose: "subscription",
        tenant_id: tenant.id,
        tier: tier.data,
        billing_cycle: billingCycle,
      },
    });
    redirect(authorization_url);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Couldn't start the subscription.",
    };
  }
}

export async function abandonToFree(_formData: FormData): Promise<void> {
  const user = await requireUser();
  const plan = PLANS.free;
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return;

  await admin
    .from("tenants")
    .update({ status: "active", subscription_tier: "free" })
    .eq("id", tenant.id);
  await admin.from("subscriptions").upsert(
    {
      tenant_id: tenant.id,
      tier: "free",
      status: "active",
      billing_cycle: "monthly",
      product_limit: plan.productLimit,
      sales_fee_pct: plan.salesFeePct,
      provider_subscription_id: null,
      current_period_start: new Date().toISOString(),
    },
    { onConflict: "tenant_id" }
  );

  redirect("/dashboard?just-finished=1");
}

async function uniqueSlug(name: string): Promise<string> {
  const admin = createAdminClient();
  const base = slugify(name) || "shop";
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { data } = await admin
      .from("tenants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

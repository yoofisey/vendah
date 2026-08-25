"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import {
  APEX_ORIGIN,
  applyPlanSwitch,
  cycleAmountMinor,
  downgradeToFree,
  ensureBillingPlan,
  type SubscriptionRow,
} from "@/lib/billing";
import { createPaystackSubaccount, initializePaystackCharge } from "@/lib/paystack";
import { PLANS } from "@/lib/plans";
import { isMomoCode } from "@/lib/settlement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle, SubscriptionTier, TenantBranding, TenantContactInfo } from "@/lib/types";

export type SettingsState = { error?: string; success?: boolean };

export async function changePassword(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireUser();

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: currentPassword,
  });
  if (signInError) {
    return { error: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });
  if (updateError) return { error: updateError.message };
  return { success: true };
}

export async function updateSubdomain(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireUser();
  const input = String(formData.get("newSubdomain") ?? "").trim();
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!normalized || normalized.length < 3) {
    return { error: "Subdomain must be at least 3 characters." };
  }
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized)) {
    return {
      error: "Use only letters, numbers, and hyphens.",
    };
  }

  const { RESERVED_SUBDOMAINS } = await import("@/lib/tenant");
  if (RESERVED_SUBDOMAINS.has(normalized)) {
    return { error: "That name is reserved." };
  }

  const admin = createAdminClient();

  const { data: current } = await admin
    .from("tenants")
    .select("id, subdomain")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!current) return { error: "Store not found." };
  if (current.subdomain === normalized) {
    return { error: "Subdomain is the same as current." };
  }

  const { data: taken } = await admin
    .from("tenants")
    .select("id")
    .eq("subdomain", normalized)
    .maybeSingle();
  if (taken) {
    return { error: "That subdomain is already taken." };
  }

  const { error } = await admin
    .from("tenants")
    .update({ subdomain: normalized })
    .eq("id", current.id);
  if (error) return { error: error.message };

  return { success: true };
}

export async function saveSettings(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireUser();

  const branding: TenantBranding = {
    logoUrl: String(formData.get("logoUrl") ?? "").trim() || undefined,
    bannerUrl: String(formData.get("bannerUrl") ?? "").trim() || undefined,
    primaryColor:
      String(formData.get("primaryColor") ?? "").trim() || undefined,
    accentColor:
      String(formData.get("accentColor") ?? "").trim() || undefined,
  };

  const contactInfo: TenantContactInfo = {
    phone: String(formData.get("phone") ?? "").trim() || undefined,
    email: String(formData.get("email") ?? "").trim() || undefined,
    whatsapp: String(formData.get("whatsapp") ?? "").trim() || undefined,
    businessHours:
      String(formData.get("businessHours") ?? "").trim() || undefined,
    deliveryNotes:
      String(formData.get("deliveryNotes") ?? "").trim() || undefined,
  };

  const feeGhs = Number(String(formData.get("deliveryFeeGhs") ?? "0").trim());
  if (!Number.isFinite(feeGhs) || feeGhs < 0 || feeGhs > 5000) {
    return { error: "Delivery fee must be between 0 and GH₵5,000." };
  }
  const deliveryFeeMinor = Math.round(feeGhs * 100);

  const allCategoryIds = formData
    .getAll("businessCategories")
    .map(String)
    .filter(Boolean);
  const primaryId = String(formData.get("businessCategory") ?? "");
  if (primaryId && !allCategoryIds.includes(primaryId)) {
    allCategoryIds.unshift(primaryId);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("tenants")
    .update({
      branding,
      contact_info: contactInfo,
      delivery_fee_minor: deliveryFeeMinor,
      business_category_id: primaryId || undefined,
      business_category_ids: allCategoryIds,
    })
    .eq("owner_id", user.id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function connectPaystack(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireUser();

  const parsed = z
    .object({
      businessName: z.string().min(2).max(120),
      settlementType: z.enum(["bank", "momo"]),
      settlementBank: z.string().min(1).max(50),
      accountNumber: z.string(),
    })
    .superRefine((val, ctx) => {
      if (val.settlementType === "bank") {
        if (!/^\d{10}$/.test(val.accountNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["accountNumber"],
            message: "Enter a 10-digit account number.",
          });
        }
      } else {
        if (!isMomoCode(val.settlementBank)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["settlementBank"],
            message: "Choose a supported mobile money network.",
          });
        }
        if (!/^0\d{9}$/.test(val.accountNumber)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["accountNumber"],
            message: "Enter a 10-digit mobile money number (e.g. 0244123456).",
          });
        }
      }
    })
    .safeParse({
      businessName: String(formData.get("businessName") ?? "").trim(),
      settlementType: String(formData.get("settlementType") ?? "momo"),
      settlementBank: String(formData.get("settlementBank") ?? "").trim(),
      accountNumber: String(formData.get("accountNumber") ?? "").trim(),
    });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check the settlement details.",
    };
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, subscription_tier, paystack_subaccount_code")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return { error: "No shop found." };

  try {
    const percentageCharge =
      PLANS[tenant.subscription_tier as SubscriptionTier].salesFeePct;
    const { subaccount_code } = await createPaystackSubaccount({
      businessName: parsed.data.businessName,
      settlementBank: parsed.data.settlementBank,
      accountNumber: parsed.data.accountNumber,
      percentageCharge,
    });

    let payoutVerified = false;
    let payoutVerifiedName: string | null = null;
    try {
      const secretKey = process.env.PAYSTACK_SECRET_KEY ?? "";
      const resolveRes = await fetch("https://api.paystack.co/bank/resolve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_number: parsed.data.accountNumber,
          bank_code: parsed.data.settlementBank,
        }),
      });
      const resolveJson = await resolveRes.json();
      if (resolveRes.ok && resolveJson.status && resolveJson.data?.account_name) {
        payoutVerified = true;
        payoutVerifiedName = resolveJson.data.account_name;
      }
    } catch {
      // Resolution is best-effort; don't block the connection
    }

    const { error } = await admin
      .from("tenants")
      .update({
        paystack_subaccount_code: subaccount_code,
        payout_verified: payoutVerified,
        payout_verified_name: payoutVerifiedName,
      })
      .eq("id", tenant.id);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to connect Paystack." };
  }

  return { success: true };
}

export async function changePlan(
  prevState: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const user = await requireUser();

  const parsed = z
    .object({
      tier: z.enum(["free", "starter", "growth", "industry"]),
      billingCycle: z.enum(["monthly", "annual"]).optional(),
    })
    .safeParse({
      tier: String(formData.get("tier") ?? ""),
      billingCycle: String(formData.get("billingCycle") ?? "") || undefined,
    });
  if (!parsed.success) return { error: "Choose a plan." };

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, subscription_tier, paystack_subaccount_code")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return { error: "No shop found." };

  const { data: subscription } = await admin
    .from("subscriptions")
    .select("*")
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  const sub = (subscription as SubscriptionRow | null) ?? null;

  const currentTier = tenant.subscription_tier as SubscriptionTier;
  const currentCycle: BillingCycle = sub?.billing_cycle ?? "monthly";
  const newTier = parsed.data.tier;
  const newCycle: BillingCycle = parsed.data.billingCycle ?? currentCycle;

  if (newTier === currentTier && newCycle === currentCycle) {
    return { success: true };
  }

  if (newTier === "free") {
    await downgradeToFree(tenant.id, sub?.provider_subscription_id, tenant.paystack_subaccount_code);
    return { success: true };
  }

  // Switching between paid plans while an active provider subscription exists:
  // apply immediately and sync the Paystack plan for the next renewal.
  if (sub?.provider_subscription_id && sub.status === "active") {
    await applyPlanSwitch(tenant.id, newTier, newCycle, sub);
    return { success: true };
  }

  // Upgrading from Free (or re-engaging a lapsed plan): charge first, then activate.
  const reference = `SUB-${crypto.randomUUID()}`;
  const { error: txError } = await admin.from("transactions").insert({
    tenant_id: tenant.id,
    provider: "paystack",
    provider_reference: reference,
    amount_minor: cycleAmountMinor(newTier, newCycle),
    currency: "GHS",
    status: "initiated",
    payload: { purpose: "subscription", tier: newTier, billing_cycle: newCycle },
  });
  if (txError) return { error: txError.message };

  try {
    const planCode = await ensureBillingPlan(newTier, newCycle);
    const { authorization_url } = await initializePaystackCharge({
      email: user.email ?? "",
      amountMinor: cycleAmountMinor(newTier, newCycle),
      reference,
      plan: planCode,
      callbackUrl: `${APEX_ORIGIN}/settings`,
      metadata: {
        purpose: "subscription",
        tenant_id: tenant.id,
        tier: newTier,
        billing_cycle: newCycle,
      },
    });
    redirect(authorization_url);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Couldn't start the subscription.",
    };
  }
}

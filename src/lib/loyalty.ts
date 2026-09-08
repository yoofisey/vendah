import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type LoyaltySettings = {
  tenant_id: string;
  enabled: boolean;
  points_per_ghs: number;
  points_to_minor: number;
  updated_at: string;
};

type RedeemResult =
  | { valid: true; creditMinor: number; pointsUsed: number }
  | { valid: false; error: string };

export async function getLoyaltySettings(
  tenantId: string
): Promise<LoyaltySettings | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("loyalty_settings")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return (data as LoyaltySettings | null) ?? null;
}

export async function getMemberBalance(
  tenantId: string,
  email: string
): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("loyalty_members")
    .select("points_balance")
    .eq("tenant_id", tenantId)
    .ilike("email", email.trim())
    .maybeSingle();
  return Number(data?.points_balance ?? 0);
}

export async function validateAndRedeemPoints(
  tenantId: string,
  email: string,
  points: number,
  orderId: string,
  pointsToMinor: number
): Promise<RedeemResult> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("redeem_loyalty_points", {
    p_tenant_id: tenantId,
    p_email: email,
    p_points: points,
    p_order_id: orderId,
    p_points_to_minor: pointsToMinor,
  });

  if (error) return { valid: false, error: "Points could not be redeemed." };
  const applied = Number(data);
  if (applied === -1) {
    return { valid: false, error: "You don't have enough points." };
  }
  if (applied <= 0) return { valid: false, error: "Enter at least 1 point." };

  return { valid: true, creditMinor: Math.round(applied), pointsUsed: points };
}

export async function awardPointsForOrder(
  tenantId: string,
  email: string | null,
  orderId: string,
  paidMinor: number,
  pointsPerGhs: number
): Promise<number> {
  if (!email || paidMinor <= 0 || pointsPerGhs <= 0) return 0;
  const points = Math.floor(paidMinor / 100) * pointsPerGhs;
  if (points <= 0) return 0;

  const admin = createAdminClient();
  await admin.rpc("award_loyalty_points", {
    p_tenant_id: tenantId,
    p_email: email,
    p_points: points,
    p_order_id: orderId,
    p_reason: "purchase",
  } as never);
  return points;
}

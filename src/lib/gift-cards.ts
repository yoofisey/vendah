import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type GiftCard = {
  id: string;
  tenant_id: string;
  code: string;
  initial_value_minor: number;
  balance_minor: number;
  status: "active" | "disabled" | "redeemed";
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateGiftCardCode(length = 12): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return result;
}

type RedeemResult =
  | { valid: true; appliedMinor: number; label: string; id: string }
  | { valid: false; error: string };

export async function validateAndRedeemGiftCard(
  tenantId: string,
  code: string,
  amountMinor: number
): Promise<RedeemResult> {
  const admin = createAdminClient();
  const { data: gc } = await admin
    .from("gift_cards")
    .select("id, code, balance_minor, status, starts_at, expires_at")
    .eq("tenant_id", tenantId)
    .eq("code", code.toUpperCase().trim())
    .maybeSingle();

  if (!gc) return { valid: false, error: "Invalid gift card code." };
  if (gc.status !== "active") {
    return {
      valid: false,
      error:
        gc.status === "redeemed"
          ? "This gift card has no remaining balance."
          : "This gift card has been disabled.",
    };
  }
  if (gc.starts_at && new Date(gc.starts_at) > new Date()) {
    return { valid: false, error: "This gift card isn't active yet." };
  }
  if (gc.expires_at && new Date(gc.expires_at) < new Date()) {
    return { valid: false, error: "This gift card has expired." };
  }
  if (gc.balance_minor <= 0) {
    return { valid: false, error: "This gift card has no remaining balance." };
  }

  // Atomically consume the balance (capped at amount and balance).
  const { data: applied, error } = await admin.rpc("redeem_gift_card", {
    p_tenant_id: tenantId,
    p_code: gc.code,
    p_amount_minor: amountMinor,
  });

  if (error || typeof applied !== "number" || applied <= 0) {
    return { valid: false, error: "This gift card could not be applied." };
  }

  return {
    valid: true,
    appliedMinor: Math.round(applied),
    label: "Gift card",
    id: gc.id,
  };
}

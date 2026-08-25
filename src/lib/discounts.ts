import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type DiscountCode = {
  id: string;
  tenant_id: string;
  code: string;
  discount_type: "percent" | "fixed";
  value: number;
  min_order_minor: number;
  max_uses: number | null;
  used_count: number;
  starts_at: string | null;
  expires_at: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

type DiscountResult =
  | { valid: true; discountMinor: number; label: string }
  | { valid: false; error: string };

export async function validateDiscountCode(
  tenantId: string,
  code: string,
  subtotalMinor: number
): Promise<DiscountResult> {
  const admin = createAdminClient();
  const { data: dc } = await admin
    .from("discount_codes")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("code", code.toUpperCase().trim())
    .eq("active", true)
    .maybeSingle();

  if (!dc) return { valid: false, error: "Invalid discount code." };

  if (dc.starts_at && new Date(dc.starts_at) > new Date()) {
    return { valid: false, error: "This code isn't active yet." };
  }
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) {
    return { valid: false, error: "This code has expired." };
  }
  if (dc.max_uses !== null && dc.used_count >= dc.max_uses) {
    return { valid: false, error: "This code has reached its usage limit." };
  }
  if (subtotalMinor < dc.min_order_minor) {
    return {
      valid: false,
      error: `Minimum order for this code is GH₵${(dc.min_order_minor / 100).toFixed(2)}.`,
    };
  }

  let discountMinor: number;
  if (dc.discount_type === "percent") {
    discountMinor = Math.round((subtotalMinor * dc.value) / 100);
  } else {
    discountMinor = Math.min(dc.value, subtotalMinor);
  }

  const label =
    dc.discount_type === "percent"
      ? `${dc.value}% off`
      : `GH₵${(dc.value / 100).toFixed(2)} off`;

  return { valid: true, discountMinor, label };
}

export async function incrementDiscountUsage(
  tenantId: string,
  code: string
): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc("increment_discount_usage" as never, {
    p_tenant_id: tenantId,
    p_code: code.toUpperCase().trim(),
  } as never);
}

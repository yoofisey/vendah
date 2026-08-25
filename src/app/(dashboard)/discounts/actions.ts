"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const discountSchema = z.object({
  code: z.string().min(3).max(40).transform((s) => s.toUpperCase().trim()),
  discountType: z.enum(["percent", "fixed"]),
  value: z.number().int().min(1),
  minOrderMinor: z.number().int().min(0).default(0),
  maxUses: z.number().int().min(1).optional().nullable(),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export type DiscountActionState = { error?: string; success?: boolean };

export async function createDiscountCode(
  _prev: DiscountActionState,
  formData: FormData
): Promise<DiscountActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = discountSchema.safeParse({
    code: String(formData.get("code") ?? ""),
    discountType: String(formData.get("discountType") ?? "percent"),
    value: Number(formData.get("value") ?? 0),
    minOrderMinor: Math.round(Number(formData.get("minOrderMinor") ?? 0) * 100),
    maxUses: formData.get("maxUses") ? Number(formData.get("maxUses")) : null,
    startsAt: formData.get("startsAt") || null,
    expiresAt: formData.get("expiresAt") || null,
  });

  if (!parsed.success) return { error: "Please check the details you entered." };
  if (parsed.data.discountType === "percent" && parsed.data.value > 100) {
    return { error: "Percentage discount cannot exceed 100%." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("discount_codes").insert({
    tenant_id: tenant.id,
    code: parsed.data.code,
    discount_type: parsed.data.discountType,
    value: parsed.data.discountType === "fixed"
      ? Math.round(parsed.data.value * 100)
      : parsed.data.value,
    min_order_minor: parsed.data.minOrderMinor,
    max_uses: parsed.data.maxUses,
    starts_at: parsed.data.startsAt || null,
    expires_at: parsed.data.expiresAt || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "A discount code with that name already exists." };
    return { error: "Couldn't create discount code. Try again." };
  }

  revalidatePath("/discounts");
  return { success: true };
}

export async function deleteDiscountCode(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("discount_codes").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/discounts");
}

export async function toggleDiscountActive(id: string, active: boolean): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin
    .from("discount_codes")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  revalidatePath("/discounts");
}

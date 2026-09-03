"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateGiftCardCode } from "@/lib/gift-cards";

const giftCardSchema = z.object({
  valueMinor: z.number().int().min(1),
  startsAt: z.string().optional().nullable(),
  expiresAt: z.string().optional().nullable(),
});

export type GiftCardActionState = {
  error?: string;
  success?: boolean;
  code?: string;
};

export async function createGiftCard(
  _prev: GiftCardActionState,
  formData: FormData
): Promise<GiftCardActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = giftCardSchema.safeParse({
    valueMinor: Math.round(Number(formData.get("valueMinor") ?? 0) * 100),
    startsAt: formData.get("startsAt") || null,
    expiresAt: formData.get("expiresAt") || null,
  });
  if (!parsed.success) return { error: "Enter a valid gift card value." };

  const admin = createAdminClient();
  const code = generateGiftCardCode();
  const { data, error } = await admin
    .from("gift_cards")
    .insert({
      tenant_id: tenant.id,
      code,
      initial_value_minor: parsed.data.valueMinor,
      balance_minor: parsed.data.valueMinor,
      status: "active",
      starts_at: parsed.data.startsAt || null,
      expires_at: parsed.data.expiresAt || null,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Couldn't create gift card. Try again." };

  revalidatePath("/gift-cards");
  return { success: true, code };
}

export async function deleteGiftCard(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("gift_cards").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/gift-cards");
}

export async function toggleGiftCardActive(
  id: string,
  active: boolean
): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin
    .from("gift_cards")
    .update(
      {
        status: active ? "active" : "disabled",
        updated_at: new Date().toISOString(),
      }
    )
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  revalidatePath("/gift-cards");
}
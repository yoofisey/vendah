"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export type ZoneActionState = { error?: string; success?: boolean };

const zoneSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().min(1, "Name is required.").max(80),
  feeGhs: z.number().min(0, "Fee must be zero or more."),
  freeAboveGhs: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export async function createZone(
  _prev: ZoneActionState,
  formData: FormData
): Promise<ZoneActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = zoneSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    feeGhs: Number(formData.get("feeGhs") ?? 0),
    freeAboveGhs: String(formData.get("freeAboveGhs") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const feeMinor = Math.round(parsed.data.feeGhs * 100);
  const freeAboveMinor = parsed.data.freeAboveGhs
    ? Math.round(Number(parsed.data.freeAboveGhs) * 100)
    : null;

  const admin = createAdminClient();
  const { error } = await admin.from("shipping_zones").insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    fee_minor: feeMinor,
    free_above_minor: freeAboveMinor,
    sort_order: parsed.data.sortOrder,
  });

  if (error) return { error: "Couldn't create shipping zone. Try again." };

  revalidatePath("/shipping");
  return { success: true };
}

export async function updateZone(
  _prev: ZoneActionState,
  formData: FormData
): Promise<ZoneActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing zone id." };

  const parsed = zoneSchema.safeParse({
    id,
    name: String(formData.get("name") ?? "").trim(),
    feeGhs: Number(formData.get("feeGhs") ?? 0),
    freeAboveGhs: String(formData.get("freeAboveGhs") ?? "").trim() || null,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const feeMinor = Math.round(parsed.data.feeGhs * 100);
  const freeAboveMinor = parsed.data.freeAboveGhs
    ? Math.round(Number(parsed.data.freeAboveGhs) * 100)
    : null;

  const admin = createAdminClient();
  const { error } = await admin
    .from("shipping_zones")
    .update({
      name: parsed.data.name,
      fee_minor: feeMinor,
      free_above_minor: freeAboveMinor,
      sort_order: parsed.data.sortOrder,
    })
    .eq("id", id)
    .eq("tenant_id", tenant.id);

  if (error) return { error: "Couldn't update shipping zone. Try again." };

  revalidatePath("/shipping");
  return { success: true };
}

export async function deleteZone(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("shipping_zones").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/shipping");
}

export async function toggleZoneActive(id: string, active: boolean): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin
    .from("shipping_zones")
    .update({ active })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  revalidatePath("/shipping");
}

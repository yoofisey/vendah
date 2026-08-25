"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const taxRateSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  ratePct: z.number().min(0).max(100),
  appliesTo: z.enum(["all", "physical", "digital"]),
});

export type TaxActionState = { error?: string; success?: boolean };

export async function createTaxRate(
  _prev: TaxActionState,
  formData: FormData
): Promise<TaxActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const parsed = taxRateSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    ratePct: Number(formData.get("ratePct") ?? 0),
    appliesTo: String(formData.get("appliesTo") ?? "all"),
  });

  if (!parsed.success) return { error: "Please check the details you entered." };

  const admin = createAdminClient();
  const { error } = await admin.from("tax_rates").insert({
    tenant_id: tenant.id,
    name: parsed.data.name,
    rate_pct: Math.round(parsed.data.ratePct * 100),
    applies_to: parsed.data.appliesTo,
  });

  if (error) {
    if (error.code === "23505") return { error: "A tax rate with that name already exists." };
    return { error: "Couldn't create tax rate. Try again." };
  }

  revalidatePath("/tax");
  return { success: true };
}

export async function deleteTaxRate(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("tax_rates").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/tax");
}

export async function toggleTaxRateActive(id: string, active: boolean): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin
    .from("tax_rates")
    .update({ active })
    .eq("id", id)
    .eq("tenant_id", tenant.id);
  revalidatePath("/tax");
}

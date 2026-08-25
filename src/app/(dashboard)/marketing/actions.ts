"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaign } from "@/lib/email-marketing";

export type MarketingActionState = { error?: string; success?: boolean; recipientCount?: number };

export async function createCampaign(
  _prev: MarketingActionState,
  formData: FormData
): Promise<MarketingActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!subject || subject.length > 200) return { error: "Please enter a valid subject line." };
  if (!body) return { error: "Please enter the email body." };

  const admin = createAdminClient();
  const { error } = await admin.from("email_campaigns").insert({
    tenant_id: tenant.id,
    subject,
    body,
  });

  if (error) return { error: "Couldn't save campaign. Try again." };

  revalidatePath("/marketing");
  return { success: true };
}

export async function sendCampaignAction(
  campaignId: string
): Promise<MarketingActionState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const result = await sendCampaign(campaignId, tenant.id);
  if (!result.success) return { error: result.error };

  revalidatePath("/marketing");
  return { success: true, recipientCount: result.recipientCount };
}

export async function deleteCampaign(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  await admin.from("email_campaigns").delete().eq("id", id).eq("tenant_id", tenant.id);
  revalidatePath("/marketing");
}

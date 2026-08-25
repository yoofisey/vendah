"use server";

import { getOrderForTracking, type TrackedOrder } from "@/lib/storefront";
import { createAdminClient } from "@/lib/supabase/admin";

export type TrackState =
  | { error?: string }
  | { order: TrackedOrder };

export async function lookupOrder(
  _prev: TrackState,
  formData: FormData
): Promise<TrackState> {
  const tenantId = String(formData.get("tenantId") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();
  const contact = String(formData.get("contact") ?? "").trim();

  if (!tenantId) return { error: "Something went wrong. Try again." };
  if (reference.length < 3) {
    return { error: "Enter your order reference." };
  }
  if (contact.length < 3) {
    return { error: "Enter the phone or email used at checkout." };
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("id", tenantId)
    .maybeSingle();
  if (!tenant) return { error: "This shop isn't available." };

  const order = await getOrderForTracking(tenantId, reference, contact);
  if (!order) {
    return {
      error: "No order found. Double-check your reference and the phone or email you used.",
    };
  }
  return { order };
}

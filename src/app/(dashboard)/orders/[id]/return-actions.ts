"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { initiatePaystackRefund } from "@/lib/paystack";

export async function processRefundAction(formData: FormData): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const orderId = String(formData.get("orderId") ?? "");
  const refundAmount = Number(formData.get("refundAmount") ?? 0);
  const reason = String(formData.get("refundReason") ?? "").trim();

  if (!orderId || refundAmount <= 0 || !reason) return;

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, total_minor, refund_minor, status")
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!order || order.status === "cancelled") return;

  const alreadyRefunded = order.refund_minor ?? 0;
  const maxRefundable = (order.total_minor as number) - alreadyRefunded;
  if (refundAmount > maxRefundable) return;

  await admin
    .from("orders")
    .update({
      refund_minor: alreadyRefunded + refundAmount,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
      status:
        alreadyRefunded + refundAmount >= order.total_minor
          ? "cancelled"
          : order.status,
    })
    .eq("id", orderId);

  const { data: transaction } = await admin
    .from("transactions")
    .select("id, provider_reference")
    .eq("order_id", orderId)
    .eq("tenant_id", tenant.id)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (transaction?.provider_reference) {
    try {
      const refund = await initiatePaystackRefund({
        transaction: transaction.provider_reference,
        amountMinor: refundAmount,
        reason,
      });
      await admin
        .from("transactions")
        .update({ refund_reference: refund.refund_reference })
        .eq("id", transaction.id);
    } catch (err) {
      console.error("Paystack refund failed:", err);
    }
  }

  revalidatePath(`/orders/${orderId}`);
}

export async function createReturnRequestAction(
  formData: FormData
): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("returnReason") ?? "").trim();

  if (!orderId || !reason) return;

  const admin = createAdminClient();
  await admin.from("return_requests").insert({
    tenant_id: tenant.id,
    order_id: orderId,
    reason,
  });

  revalidatePath(`/orders/${orderId}`);
}

"use server";

import { z } from "zod";
import { requireUser, getCurrentTenant } from "@/lib/auth";
import { sendOrderStatusUpdate } from "@/lib/fulfilment";
import { ORDER_STATUSES } from "@/lib/order-status";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const orderStatusSchema = z.enum(ORDER_STATUSES);

export async function setOrderStatus(formData: FormData): Promise<void> {
  const user = await requireUser();
  const orderId = String(formData.get("orderId") ?? "");
  const status = orderStatusSchema.safeParse(formData.get("status"));
  if (!status.success || !orderId) return;

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return;

  const now = new Date().toISOString();
  const { data: order } = await admin
    .from("orders")
    .update({ status: status.data, status_updated_at: now })
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .select("*")
    .maybeSingle();
  if (!order) return;

  if (["processing", "shipped", "delivered", "cancelled"].includes(status.data)) {
    const { data: items } = await admin
      .from("order_items")
      .select("product_name, quantity, price_minor")
      .eq("order_id", order.id);
    await sendOrderStatusUpdate(order, items ?? [], status.data);
  }
}

export type RefundState = { error?: string; success?: boolean };

export async function processRefund(
  _prev: RefundState,
  formData: FormData
): Promise<RefundState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const orderId = String(formData.get("orderId") ?? "");
  const refundAmount = Number(formData.get("refundAmount") ?? 0);
  const reason = String(formData.get("refundReason") ?? "").trim();

  if (!orderId) return { error: "Invalid order." };
  if (refundAmount <= 0) return { error: "Enter a refund amount greater than zero." };
  if (!reason) return { error: "Please provide a reason for the refund." };

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, total_minor, refund_minor, status")
    .eq("id", orderId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!order) return { error: "Order not found." };
  if (order.status === "cancelled") return { error: "Cannot refund a cancelled order." };

  const alreadyRefunded = order.refund_minor ?? 0;
  const maxRefundable = (order.total_minor as number) - alreadyRefunded;
  if (refundAmount > maxRefundable) {
    return { error: `Maximum refundable amount is GH₵${(maxRefundable / 100).toFixed(2)}.` };
  }

  const { error } = await admin
    .from("orders")
    .update({
      refund_minor: alreadyRefunded + refundAmount,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
      status: alreadyRefunded + refundAmount >= order.total_minor ? "cancelled" : order.status,
    })
    .eq("id", orderId);

  if (error) return { error: "Couldn't process refund. Try again." };

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function createReturnRequest(
  _prev: RefundState,
  formData: FormData
): Promise<RefundState> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: "No store found." };

  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("returnReason") ?? "").trim();

  if (!orderId) return { error: "Invalid order." };
  if (!reason) return { error: "Please provide a reason for the return." };

  const admin = createAdminClient();
  const { error } = await admin.from("return_requests").insert({
    tenant_id: tenant.id,
    order_id: orderId,
    reason,
  });

  if (error) return { error: "Couldn't create return request. Try again." };

  revalidatePath(`/orders/${orderId}`);
  return { success: true };
}

export async function resolveReturnRequest(
  returnId: string,
  approved: boolean,
  refundMinor?: number
): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  const { data: ret } = await admin
    .from("return_requests")
    .select("id, order_id")
    .eq("id", returnId)
    .eq("tenant_id", tenant.id)
    .maybeSingle();

  if (!ret) return;

  await admin
    .from("return_requests")
    .update({
      status: approved ? "approved" : "rejected",
      refund_minor: approved ? (refundMinor ?? 0) : null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", returnId);

  if (approved && refundMinor && refundMinor > 0) {
    const { data: order } = await admin
      .from("orders")
      .select("refund_minor, total_minor")
      .eq("id", ret.order_id)
      .maybeSingle();
    if (order) {
      const newRefund = (order.refund_minor ?? 0) + refundMinor;
      await admin
        .from("orders")
        .update({
          refund_minor: newRefund,
          refunded_at: new Date().toISOString(),
          status: newRefund >= (order.total_minor as number) ? "cancelled" : undefined,
        })
        .eq("id", ret.order_id);
    }
  }

  revalidatePath(`/orders/${ret.order_id}`);
}

import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { incrementDiscountUsage } from "@/lib/discounts";
import {
  sendNewOrderNotificationToMerchant,
  sendOrderConfirmation,
} from "@/lib/fulfilment";
import {
  sendLowStockAlert,
  LOW_STOCK_THRESHOLD,
} from "@/lib/low-stock-alerts";
import { getLoyaltySettings, awardPointsForOrder } from "@/lib/loyalty";

type OrderRow = {
  id: string;
  tenant_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_method: string | null;
  status: string;
  total_minor: number;
  currency: string;
  [key: string]: unknown;
};

type OrderItemRow = {
  id: string;
  product_name: string;
  price_minor: number;
  quantity: number;
  [key: string]: unknown;
};

export type FinalizeResult =
  | { ok: true; order: OrderRow; items: OrderItemRow[] }
  | {
      ok: false;
      reason: "not_found" | "unpaid" | "error";
      channel?: string | null;
    };

async function fetchOrderBundle(
  orderId: string
): Promise<{ order: OrderRow; items: OrderItemRow[] } | null> {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (!order) return null;
  const { data: items } = await admin
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("id", { ascending: true });
  return { order, items: items ?? [] };
}

/**
 * Marks a transaction and its order as paid (idempotent), decrements stock,
 * and emails the customer. Returns the order bundle if the order is paid.
 */
export async function settlePaidTransaction(
  txId: string,
  verification?: Awaited<ReturnType<typeof verifyPaystackTransaction>>
): Promise<FinalizeResult> {
  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("transactions")
    .select("id, order_id, status")
    .eq("id", txId)
    .maybeSingle();
  if (!tx?.order_id) return { ok: false, reason: "not_found" };

  if (tx.status !== "success") {
    const { data: result, error } = await admin.rpc("settle_order", {
      p_tx_id: tx.id,
      p_payload: verification ?? {},
    });
    if (error) return { ok: false, reason: "error" };

    const alreadySettled = (result as { already_settled?: boolean })?.already_settled;
    if (!alreadySettled) {
      const { data: order } = await admin
        .from("orders")
        .select("id, tenant_id, discount_code")
        .eq("id", tx.order_id)
        .maybeSingle();

      if (order) {
        const { data: items } = await admin
          .from("order_items")
          .select("product_id, quantity")
          .eq("order_id", order.id);
        for (const item of items ?? []) {
          if (!item.product_id) continue;
          const { data: product } = await admin
            .from("products")
            .select("stock, name")
            .eq("id", item.product_id)
            .maybeSingle();
          if (product && product.stock <= LOW_STOCK_THRESHOLD) {
            await sendLowStockAlert(order.tenant_id, product.name, product.stock);
          }
        }

        const bundle = await fetchOrderBundle(order.id);
        if (bundle) {
          await sendOrderConfirmation(bundle.order, bundle.items);
          await sendNewOrderNotificationToMerchant(bundle.order, bundle.items);
        }

        if (order.discount_code) {
          await incrementDiscountUsage(order.tenant_id, order.discount_code);
        }

        const settings = await getLoyaltySettings(order.tenant_id);
        const orderRow = await admin
          .from("orders")
          .select("customer_email, total_minor")
          .eq("id", order.id)
          .maybeSingle();
        if (settings?.enabled && orderRow?.data?.customer_email) {
          const awarded = await awardPointsForOrder(
            order.tenant_id,
            orderRow.data.customer_email,
            order.id,
            Number(orderRow.data.total_minor),
            settings.points_per_ghs
          );
          if (awarded > 0) {
            await admin
              .from("orders")
              .update({ loyalty_points_awarded: awarded })
              .eq("id", order.id);
          }
        }
      }
    }
  }

  const bundle = await fetchOrderBundle(tx.order_id);
  if (!bundle) return { ok: false, reason: "not_found" };
  return { ok: true, ...bundle };
}

/**
 * Looks up a Paystack charge by reference, verifies it against Paystack,
 * settles it if paid, and returns the order. Used by the checkout success
 * page; the webhook calls settlePaidTransaction after verification.
 */
export async function finalizePaidOrder(
  reference: string
): Promise<FinalizeResult> {
  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("transactions")
    .select("id, order_id, status, payload")
    .eq("provider", "paystack")
    .eq("provider_reference", reference)
    .maybeSingle();
  if (!tx?.order_id) return { ok: false, reason: "not_found" };

  if (tx.status === "success") {
    const bundle = await fetchOrderBundle(tx.order_id);
    return bundle ? { ok: true, ...bundle } : { ok: false, reason: "not_found" };
  }

  let verification: Awaited<ReturnType<typeof verifyPaystackTransaction>>;
  try {
    verification = await verifyPaystackTransaction(reference);
  } catch {
    return { ok: false, reason: "error" };
  }
  if (!verification || verification.status !== "success") {
    const payload = tx.payload as { channel?: string } | null;
    return { ok: false, reason: "unpaid", channel: payload?.channel ?? null };
  }

  return settlePaidTransaction(tx.id, verification);
}

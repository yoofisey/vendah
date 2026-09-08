import "server-only";

import {
  merchantNewOrderHtml,
  orderConfirmationHtml,
  orderStatusHtml,
  orderRef,
  sendEmail,
  type EmailOrder,
} from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardUrl } from "@/lib/tenant";

type OrderRow = {
  id: string;
  tenant_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  total_minor: number;
  currency: string;
  delivery_method: string | null;
  status: string;
  [key: string]: unknown;
};

type OrderItemRow = {
  product_name: string;
  quantity: number;
  price_minor: number;
  [key: string]: unknown;
};

function toEmailOrder(
  order: OrderRow,
  items: OrderItemRow[]
): EmailOrder {
  return {
    id: order.id,
    totalMinor: order.total_minor,
    currency: order.currency,
    deliveryMethod: order.delivery_method,
    items: items.map((item) => ({
      name: item.product_name,
      quantity: item.quantity,
      priceMinor: item.price_minor,
      currency: order.currency,
    })),
  };
}

async function getTenantName(tenantId: string): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenants")
    .select("name")
    .eq("id", tenantId)
    .maybeSingle();
  return data?.name ?? "your shop";
}

export async function sendOrderConfirmation(
  order: OrderRow,
  items: OrderItemRow[]
): Promise<void> {
  if (!order.customer_email) return;
  try {
    const shopName = await getTenantName(order.tenant_id);
    const emailOrder = toEmailOrder(order, items);
    await sendEmail({
      to: order.customer_email,
      subject: `Your order ${orderRef(order.id)} from ${shopName} is confirmed`,
      html: orderConfirmationHtml(
        shopName,
        emailOrder,
        (order.payment_method as string | null) ?? null
      ),
    });
  } catch (error) {
    console.error("[venfii:email] order confirmation failed", error);
  }
}

export async function sendNewOrderNotificationToMerchant(
  order: OrderRow,
  items: OrderItemRow[]
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("name, owner_id")
      .eq("id", order.tenant_id)
      .maybeSingle();
    if (!tenant?.name || !tenant.owner_id) return;
    const { data: owner } = await admin.auth.admin.getUserById(tenant.owner_id);
    const ownerEmail = owner?.user?.email ?? null;
    if (!ownerEmail) return;

    const emailOrder = toEmailOrder(order, items);
    await sendEmail({
      to: ownerEmail,
      subject: `New order ${orderRef(order.id)} — ${tenant.name}`,
      html: merchantNewOrderHtml(
        tenant.name,
        emailOrder,
        {
          name: order.customer_name ?? "A customer",
          phone: (order.customer_phone as string | null) ?? null,
          email: order.customer_email,
          notes: (order.notes as string | null) ?? null,
        },
        getDashboardUrl(`/orders/${order.id}`),
        (order.payment_method as string | null) ?? null
      ),
    });
  } catch (error) {
    console.error("[venfii:email] merchant notification failed", error);
  }
}

export async function sendOrderStatusUpdate(
  order: OrderRow,
  items: OrderItemRow[],
  status: string
): Promise<void> {
  if (!order.customer_email) return;
  try {
    const shopName = await getTenantName(order.tenant_id);
    const emailOrder = toEmailOrder(order, items);
    const titles: Record<string, string> = {
      processing: "We're preparing your order",
      shipped: "Your order is on its way",
      delivered: "Your order has been delivered",
      cancelled: "Your order was cancelled",
    };
    await sendEmail({
      to: order.customer_email,
      subject: `${titles[status] ?? "Order update"} · ${shopName}`,
      html: orderStatusHtml(shopName, emailOrder, status),
    });
  } catch (error) {
    console.error("[venfii:email] order status update failed", error);
  }
}

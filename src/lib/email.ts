import "server-only";

import { formatMoney } from "@/lib/format";

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sends an email. Currently in "mock" mode: every email is logged to the
 * console so fulfilment wiring is verifiable without a provider.
 *
 * To go live, add a RESEND_API_KEY (and an EMAIL_FROM address, e.g.
 * "Shop Name <no-reply@shop.vendah.com>") to .env — the Resend branch below
 * takes over automatically and no other code changes are needed.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "vendah <onboarding@resend.dev>";

  if (apiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ from, to: [to], subject, html }),
      });
      if (!response.ok) {
        console.error(`[vendah:email] resend error ${response.status}: ${await response.text()}`);
      }
      return;
    } catch (error) {
      console.error("[vendah:email] resend request failed", error);
      return;
    }
  }

  console.log(
    `[vendah:email] to=${to} subject="${subject}" (mock mode — set RESEND_API_KEY to send)`
  );
  console.log(html);
}

export type EmailOrderItem = {
  name: string;
  quantity: number;
  priceMinor: number;
  currency: string;
};

export type EmailOrder = {
  id: string;
  totalMinor: number;
  currency: string;
  deliveryMethod: string | null;
  items: EmailOrderItem[];
};

export function orderRef(id: string): string {
  return `#${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function merchantNewOrderHtml(
  shopName: string,
  order: EmailOrder,
  customer: {
    name: string;
    phone: string | null;
    email: string | null;
    notes: string | null;
  },
  dashboardUrl: string,
  paymentMethod?: string | null
): string {
  const isCod = paymentMethod === "cod";
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">
            ${item.name} &times; ${item.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;">
            ${formatMoney(item.priceMinor * item.quantity, item.currency)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">New order ${orderRef(order.id)}</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;">
        ${shopName} just received a ${isCod ? "new order" : "paid order"} from ${customer.name}.
      </p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin:16px 0 0;font-size:14px;">
        <strong>Total ${isCod ? "to collect on delivery" : "paid"}:</strong> ${formatMoney(order.totalMinor, order.currency)}
      </p>
      <p style="margin:8px 0 0;color:#666;font-size:13px;">
        Collection: <strong style="text-transform:capitalize;">${order.deliveryMethod ?? "pickup"}</strong>
      </p>
      <p style="margin:8px 0 0;color:#666;font-size:13px;">
        Customer: <strong>${customer.name}</strong>
        ${customer.phone ? `<br/>Phone: ${customer.phone}` : ""}
        ${customer.email ? `<br/>Email: ${customer.email}` : ""}
      </p>
      ${
        customer.notes
          ? `<p style="margin:8px 0 0;color:#666;font-size:13px;">Notes: ${customer.notes}</p>`
          : ""
      }
      <p style="margin:24px 0 0;">
        <a href="${dashboardUrl}" style="background:#1b4332;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">
          View order in dashboard
        </a>
      </p>
    </div>
  `;
}

export function orderConfirmationHtml(
  shopName: string,
  order: EmailOrder,
  paymentMethod?: string | null
): string {
  const isCod = paymentMethod === "cod";
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">
            ${item.name} &times; ${item.quantity}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;">
            ${formatMoney(item.priceMinor * item.quantity, item.currency)}
          </td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">Thank you for your order</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;">
        Your order ${orderRef(order.id)} from ${shopName} is confirmed.
      </p>
      <table style="width:100%;border-collapse:collapse;">${rows}</table>
      <p style="margin:16px 0 0;font-size:14px;">
        <strong>Total:</strong> ${formatMoney(order.totalMinor, order.currency)}
      </p>
      ${
        isCod
          ? `<p style="margin:8px 0 0;color:#333;font-size:13px;">
        Payment: <strong>cash on delivery</strong> — please have ${formatMoney(order.totalMinor, order.currency)} ready when your order arrives.
      </p>`
          : ""
      }
      <p style="margin:8px 0 0;color:#666;font-size:13px;">
        Collection: <strong style="text-transform:capitalize;">${order.deliveryMethod ?? "pickup"}</strong>
      </p>
      <p style="margin:24px 0 0;color:#666;font-size:13px;">
        We'll let you know when your order moves. Questions? Reply to this email or reach ${shopName} directly.
      </p>
    </div>
  `;
}

export function orderStatusHtml(
  shopName: string,
  order: EmailOrder,
  status: string
): string {
  const titles: Record<string, string> = {
    processing: "We're preparing your order",
    shipped: "Your order is on its way",
    delivered: "Your order has been delivered",
    cancelled: "Your order was cancelled",
  };
  const body: Record<string, string> = {
    processing: `${shopName} has started working on your order and will update you at the next step.`,
    shipped:
      order.deliveryMethod === "delivery"
        ? `Good news from ${shopName}: your order has been shipped and is on its way to you.`
        : `Your order from ${shopName} is ready for pickup.`,
    delivered: `Your order from ${shopName} has been delivered. Enjoy!`,
    cancelled: `Unfortunately your order with ${shopName} was cancelled. If you've already paid, the refund will be processed by the shop.`,
  };

  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">${titles[status] ?? "Order update"}</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;">
        Order ${orderRef(order.id)} · ${shopName}
      </p>
      <p style="margin:0 0 16px;color:#333;font-size:14px;">${body[status] ?? ""}</p>
      <p style="margin:0;color:#666;font-size:13px;">
        ${order.items.length} ${order.items.length === 1 ? "item" : "items"} · Total ${formatMoney(order.totalMinor, order.currency)}
      </p>
      <p style="margin:24px 0 0;color:#666;font-size:13px;">
        Questions? Reach ${shopName} directly.
      </p>
    </div>
  `;
}

import { sendEmail, orderRef } from "@/lib/email";
import { formatMoney } from "@/lib/format";
import { getStorefrontUrl } from "@/lib/tenant";

type OrderEmailItem = {
  name: string;
  quantity: number;
  priceMinor: number;
  currency: string;
};

type OrderConfirmationInput = {
  subdomain: string;
  shopName: string;
  orderReference: string;
  customerName: string;
  customerEmail: string;
  items: OrderEmailItem[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  taxMinor: number;
  discountMinor: number;
  totalMinor: number;
  currency: string;
  deliveryMethod: string;
  paymentMethod: string;
};

export async function sendOrderConfirmation(
  input: OrderConfirmationInput
): Promise<void> {
  const {
    subdomain,
    shopName,
    orderReference,
    customerName,
    customerEmail,
    items,
    subtotalMinor,
    deliveryFeeMinor,
    taxMinor,
    discountMinor,
    totalMinor,
    currency,
    deliveryMethod,
    paymentMethod,
  } = input;

  const trackUrl = `${getStorefrontUrl(subdomain)}/track?order=${orderReference}`;
  const displayRef = orderRef(orderReference);

  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">
            ${item.name}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;">
            ${formatMoney(item.priceMinor * item.quantity, item.currency)}
          </td>
        </tr>`
    )
    .join("");

  const paymentLabels: Record<string, string> = {
    card: "Card",
    mtn: "MTN Mobile Money",
    vodafone: "Vodafone Cash",
    airteltigo: "AirtelTigo Money",
  };

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#333;">
      <div style="background:#1b4332;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
        <h1 style="margin:0;font-size:18px;font-weight:600;">${shopName}</h1>
        <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">Order Confirmation</p>
      </div>

      <div style="padding:24px;background:#ffffff;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px;">
        <h2 style="margin:0 0 4px;font-size:18px;color:#111;">Thank you, ${customerName}!</h2>
        <p style="margin:0 0 20px;font-size:14px;color:#666;">
          Your order <strong>${displayRef}</strong> has been received and is being prepared.
        </p>

        <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
          <tr>
            <th style="text-align:left;padding:6px 0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
            <th style="text-align:center;padding:6px 0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
            <th style="text-align:right;padding:6px 0;font-size:12px;color:#999;text-transform:uppercase;letter-spacing:0.5px;">Price</th>
          </tr>
          ${itemRows}
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#666;">Subtotal</td>
            <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">${formatMoney(subtotalMinor, currency)}</td>
          </tr>
          ${deliveryFeeMinor > 0 ? `
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#666;">Delivery fee</td>
            <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">${formatMoney(deliveryFeeMinor, currency)}</td>
          </tr>` : ""}
          ${taxMinor > 0 ? `
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#666;">Tax</td>
            <td style="padding:4px 0;font-size:14px;color:#333;text-align:right;">${formatMoney(taxMinor, currency)}</td>
          </tr>` : ""}
          ${discountMinor > 0 ? `
          <tr>
            <td style="padding:4px 0;font-size:14px;color:#666;">Discount</td>
            <td style="padding:4px 0;font-size:14px;color:#1b4332;text-align:right;">-${formatMoney(discountMinor, currency)}</td>
          </tr>` : ""}
          <tr>
            <td style="padding:8px 0 0;font-size:15px;font-weight:600;border-top:1px solid #eee;">Total</td>
            <td style="padding:8px 0 0;font-size:15px;font-weight:600;border-top:1px solid #eee;text-align:right;">${formatMoney(totalMinor, currency)}</td>
          </tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#666;">Delivery method</td>
            <td style="padding:4px 0;font-size:13px;color:#333;text-align:right;text-transform:capitalize;">${deliveryMethod}</td>
          </tr>
          <tr>
            <td style="padding:4px 0;font-size:13px;color:#666;">Payment method</td>
            <td style="padding:4px 0;font-size:13px;color:#333;text-align:right;">${paymentLabels[paymentMethod] ?? paymentMethod}</td>
          </tr>
        </table>

        <a href="${trackUrl}" style="display:inline-block;background:#1b4332;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:500;">
          Track your order
        </a>

        <p style="margin:24px 0 0;font-size:13px;color:#999;text-align:center;">
          Questions? Reply to this email or reach ${shopName} directly.
        </p>
      </div>
    </div>
  `;

  await sendEmail({
    to: customerEmail,
    subject: `Order ${displayRef} confirmed – ${shopName}`,
    html,
  });
}

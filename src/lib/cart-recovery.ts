import "server-only";

import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/format";
import { getStorefrontUrl } from "@/lib/tenant";
import { createAdminClient } from "@/lib/supabase/admin";

type CartRecoveryItem = {
  productId: string;
  name: string;
  priceMinor: number;
  currency: string;
  quantity: number;
};

export async function sendCartRecoveryEmail(
  tenantId: string,
  email: string,
  items: CartRecoveryItem[],
  totalMinor: number
): Promise<void> {
  const admin = createAdminClient();

  const { data: tenant } = await admin
    .from("tenants")
    .select("name, subdomain")
    .eq("id", tenantId)
    .single();

  if (!tenant) return;

  const shopName = tenant.name;
  const storefrontUrl = getStorefrontUrl(tenant.subdomain);

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;color:#333;">
          ${item.name} &times; ${item.quantity}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;color:#333;">
          ${formatMoney(item.priceMinor * item.quantity, item.currency)}
        </td>
      </tr>`
    )
    .join("");

  const currency = items[0]?.currency ?? "GHS";

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">You left something behind!</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;">
        You have items waiting in your cart at ${shopName}. Complete your order before they're gone.
      </p>
      <table style="width:100%;border-collapse:collapse;">${itemRows}</table>
      <p style="margin:16px 0 0;font-size:14px;">
        <strong>Total:</strong> ${formatMoney(totalMinor, currency)}
      </p>
      <p style="margin:24px 0 0;">
        <a href="${storefrontUrl}" style="background:#1b4332;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;display:inline-block;">
          Complete your order
        </a>
      </p>
      <p style="margin:24px 0 0;color:#999;font-size:12px;">
        ${shopName} &middot; <a href="${storefrontUrl}" style="color:#999;">Visit shop</a>
      </p>
    </div>
  `;

  await sendEmail({
    to: email,
    subject: `You left items in your cart at ${shopName}`,
    html,
  });

  await admin.from("cart_recovery_logs").insert({
    tenant_id: tenantId,
    email,
    items_json: items,
    total_minor: totalMinor,
  });
}

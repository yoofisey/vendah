import "server-only";

import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDashboardUrl } from "@/lib/tenant";

export const LOW_STOCK_THRESHOLD = 5;

export async function sendLowStockAlert(
  tenantId: string,
  productName: string,
  currentStock: number
): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: tenant } = await admin
      .from("tenants")
      .select("name, owner_id")
      .eq("id", tenantId)
      .maybeSingle();
    if (!tenant?.name || !tenant.owner_id) return;

    const { data: owner } = await admin.auth.admin.getUserById(tenant.owner_id);
    const ownerEmail = owner?.user?.email ?? null;
    if (!ownerEmail) return;

    const editUrl = getDashboardUrl("/products");

    await sendEmail({
      to: ownerEmail,
      subject: `\u26a0\ufe0f Low stock: ${productName}`,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
          <h2 style="margin:0 0 4px;color:#111;">Low stock alert</h2>
          <p style="margin:0 0 20px;color:#666;font-size:14px;">
            A product in ${tenant.name} is running low.
          </p>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">Product</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:600;">${productName}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;">Current stock</td>
              <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:600;color:${currentStock === 0 ? "#dc2626" : "#d97706"};">${currentStock}</td>
            </tr>
          </table>
          <p style="margin:24px 0 0;">
            <a href="${editUrl}" style="background:#1b4332;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">
              Manage products
            </a>
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error("[venfii:email] low stock alert failed", error);
  }
}

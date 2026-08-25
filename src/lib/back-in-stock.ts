import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { getStorefrontUrl } from "@/lib/tenant";
import { formatMoney } from "@/lib/format";
import { sendEmail } from "@/lib/email";

export async function subscribeBackInStock(
  tenantId: string,
  productId: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("back_in_stock_notifications")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("product_id", productId)
    .eq("email", email.toLowerCase().trim())
    .eq("notified", false)
    .maybeSingle();

  if (existing) {
    return { ok: false, error: "You're already on the list for this product." };
  }

  const { error } = await admin.from("back_in_stock_notifications").insert({
    tenant_id: tenantId,
    product_id: productId,
    email: email.toLowerCase().trim(),
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function notifyBackInStock(
  tenantId: string,
  productId: string
): Promise<void> {
  const admin = createAdminClient();

  const [{ data: product }, { data: tenant }, { data: subscriptions }] =
    await Promise.all([
      admin
        .from("products")
        .select("name, slug, price_minor, currency")
        .eq("id", productId)
        .maybeSingle(),
      admin
        .from("tenants")
        .select("name, subdomain")
        .eq("id", tenantId)
        .maybeSingle(),
      admin
        .from("back_in_stock_notifications")
        .select("id, email")
        .eq("tenant_id", tenantId)
        .eq("product_id", productId)
        .eq("notified", false),
    ]);

  if (!product || !tenant || !subscriptions?.length) return;

  const storefrontUrl = tenant.subdomain
    ? `${getStorefrontUrl(tenant.subdomain)}/products/${product.slug}`
    : null;

  const subject = `${product.name} is back in stock!`;
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 4px;color:#111;">Good news — ${product.name} is back!</h2>
      <p style="margin:0 0 20px;color:#666;font-size:14px;">
        The item you were waiting for at ${tenant.name} is available again.
      </p>
      <p style="margin:0 0 16px;font-size:14px;color:#333;">
        <strong>${formatMoney(product.price_minor, product.currency)}</strong>
      </p>
      ${
        storefrontUrl
          ? `<p style="margin:24px 0 0;">
              <a href="${storefrontUrl}" style="background:#1b4332;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;">
                Shop now
              </a>
            </p>`
          : ""
      }
      <p style="margin:24px 0 0;color:#666;font-size:13px;">
        — ${tenant.name}
      </p>
    </div>
  `;

  const ids: string[] = [];
  for (const sub of subscriptions) {
    await sendEmail({ to: sub.email, subject, html });
    ids.push(sub.id);
  }

  if (ids.length > 0) {
    await admin
      .from("back_in_stock_notifications")
      .update({ notified: true })
      .in("id", ids);
  }
}

export async function getBackInStockCount(
  tenantId: string
): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("back_in_stock_notifications")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("notified", false);
  return count ?? 0;
}

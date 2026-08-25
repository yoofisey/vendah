import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

type SendCampaignResult =
  | { success: true; recipientCount: number }
  | { success: false; error: string };

export async function sendCampaign(
  campaignId: string,
  tenantId: string
): Promise<SendCampaignResult> {
  const admin = createAdminClient();

  const { data: campaign } = await admin
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .eq("tenant_id", tenantId)
    .eq("status", "draft")
    .maybeSingle();

  if (!campaign) return { success: false, error: "Campaign not found or already sent." };

  const { data: tenant } = await admin
    .from("tenants")
    .select("name, subdomain")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) return { success: false, error: "Store not found." };

  const { data: orders } = await admin
    .from("orders")
    .select("customer_email")
    .eq("tenant_id", tenantId)
    .not("customer_email", "is", null);

  const emails = [...new Set((orders ?? []).map((o) => o.customer_email).filter(Boolean))] as string[];

  if (emails.length === 0) {
    await admin
      .from("email_campaigns")
      .update({ status: "sent", recipient_count: 0, sent_at: new Date().toISOString() })
      .eq("id", campaignId);
    return { success: true, recipientCount: 0 };
  }

  let sent = 0;
  for (const email of emails) {
    try {
      await sendEmail({
        to: email,
        subject: campaign.subject,
        html: `
          <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:32px;">
            <h2 style="color:#1b4332;">${campaign.subject}</h2>
            <div style="margin-top:16px;line-height:1.6;color:#1c1c1e;white-space:pre-line;">${campaign.body}</div>
            <hr style="margin:32px 0;border:none;border-top:1px solid #e5e7eb;" />
            <p style="font-size:12px;color:#999;text-align:center;">
              Sent by <a href="https://vendah.com" style="color:#1b4332;">vendah</a> for ${tenant.name}
            </p>
          </div>
        `,
      });
      sent++;
    } catch {
      // skip failed emails
    }
  }

  await admin
    .from("email_campaigns")
    .update({
      status: "sent",
      recipient_count: sent,
      sent_at: new Date().toISOString(),
    })
    .eq("id", campaignId);

  return { success: true, recipientCount: sent };
}

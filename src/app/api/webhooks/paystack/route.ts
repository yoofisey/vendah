import { createHmac, timingSafeEqual } from "node:crypto";
import { finalizePaidOrder } from "@/lib/orders";
import { verifyPaystackTransaction } from "@/lib/paystack";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  activateSubscriptionFromPayment,
  handleInvoiceCreated,
  handleSubscriptionDisabled,
  markSubscriptionPastDue,
} from "@/lib/billing";

export async function POST(request: Request) {
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";
  const signature = request.headers.get("x-paystack-signature");
  const body = await request.text();

  const expected = createHmac("sha512", secret).update(body).digest("hex");
  const signatureBuffer = signature ? Buffer.from(signature) : Buffer.alloc(0);
  const expectedBuffer = Buffer.from(expected);
  if (
    !signature ||
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return new Response("invalid signature", { status: 401 });
  }

  const event = JSON.parse(body);

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("webhook_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();

  if (existing) {
    return new Response("ok", { status: 200 });
  }

  switch (event?.event) {
    case "charge.success": {
      const reference = event?.data?.reference;
      const metadata = event?.data?.metadata ?? {};
      if (typeof reference !== "string") break;
      if (metadata.purpose === "subscription") {
        const verified = await verifyPaystackTransaction(reference);
        if (verified.status === "success") {
          await activateSubscriptionFromPayment(verified);
        }
      } else {
        await finalizePaidOrder(reference);
      }
      break;
    }
    case "charge.failed": {
      const metadata = event?.data?.metadata ?? {};
      if (metadata.purpose === "subscription" && metadata.tenant_id) {
        await markSubscriptionPastDue(metadata.tenant_id as string);
      }
      break;
    }
    case "subscription.disable":
      await handleSubscriptionDisabled(event?.data ?? {});
      break;
    case "invoice.create":
      await handleInvoiceCreated(event?.data ?? {});
      break;
  }

  await admin.from("webhook_events").insert({ id: event.id });

  return new Response("ok", { status: 200 });
}

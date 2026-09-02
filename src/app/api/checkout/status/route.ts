import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaidOrder } from "@/lib/orders";
import { verifyPaystackTransaction } from "@/lib/paystack";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("ref");

  if (!ref) {
    return NextResponse.json({ error: "ref is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tx } = await admin
    .from("transactions")
    .select("id, order_id, status")
    .eq("provider", "paystack")
    .eq("provider_reference", ref)
    .maybeSingle();

  if (!tx) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  if (tx.status === "success") {
    return NextResponse.json({ status: "paid", orderId: tx.order_id });
  }

  if (tx.status === "initiated") {
    try {
      const verified = await verifyPaystackTransaction(ref);
      if (verified.status === "success") {
        const result = await finalizePaidOrder(ref);
        if (result.ok) {
          return NextResponse.json({ status: "paid", orderId: result.order.id });
        }
      }
    } catch {
      // verification failed — fall through to pending
    }
    return NextResponse.json({ status: "pending" });
  }

  return NextResponse.json({ status: "pending" });
}

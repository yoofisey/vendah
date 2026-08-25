"use server";

import { revalidatePath } from "next/cache";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCartRecoveryEmail } from "@/lib/cart-recovery";

export async function resendRecoveryEmail(id: string): Promise<void> {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) return;

  const admin = createAdminClient();
  const { data: log } = await admin
    .from("cart_recovery_logs")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .single();

  if (!log) return;

  await sendCartRecoveryEmail(
    tenant.id,
    log.email,
    log.items_json,
    log.total_minor
  );

  revalidatePath("/cart-recovery");
}

"use server";

import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export async function subscribeNewsletter(
  tenantId: string,
  email: string
): Promise<{ ok: boolean; error?: string }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ tenant_id: tenantId, email: trimmed });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You're already subscribed!" };
    }
    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}

export const getSubscriberCount = cache(
  async (tenantId: string): Promise<number> => {
    const supabase = await createClient();
    const { count } = await supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId);
    return count ?? 0;
  }
);

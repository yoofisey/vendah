import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Tenant } from "@/lib/types";

export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect("/sign-in");
  }
  return user;
}

export const getCurrentTenant = cache(async (): Promise<Tenant | null> => {
  const user = await getUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();
  return (data as Tenant) ?? null;
});

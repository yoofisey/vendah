"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const emailSchema = z.string().trim().toLowerCase().email();

export type CustomerAuthState = {
  error?: string;
  needEmailConfirmation?: boolean;
};

export async function customerSignUp(
  prevState: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const subdomain = String(formData.get("subdomain") ?? "").trim();

  if (!email.success) return { error: "Enter a valid email address." };
  if (password.length < 6)
    return { error: "Password must be at least 6 characters." };
  if (name.length < 1) return { error: "Enter your name." };

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle();

  if (!tenant) return { error: "Store not found." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password,
    options: { data: { full_name: name } },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Couldn't create your account." };

  const { data: adminUser } = await admin.auth.admin.getUserById(data.user.id);
  if (!adminUser?.user) {
    const { error: createErr } = await admin.auth.admin.createUser({
      id: data.user.id,
      email: email.data!,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });
    if (createErr) return { error: createErr.message };
  }

  const { error: insertErr } = await admin.from("customer_accounts").insert({
    tenant_id: tenant.id,
    user_id: data.user.id,
    name,
    email: email.data,
  });
  if (insertErr && insertErr.code !== "23505") {
    return { error: insertErr.message };
  }

  if (!data.session) {
    return { needEmailConfirmation: true };
  }

  redirect(`/account`);
}

export async function customerSignIn(
  prevState: CustomerAuthState,
  formData: FormData
): Promise<CustomerAuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");

  if (!email.success) return { error: "Enter a valid email address." };
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password,
  });

  if (error) return { error: "Invalid email or password." };
  redirect(`/account`);
}

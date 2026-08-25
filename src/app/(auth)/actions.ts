"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCategoryPreset } from "@/lib/category-presets";
import {
  isValidSubdomain,
  normalizeSubdomain,
  RESERVED_SUBDOMAINS,
} from "@/lib/tenant";

export type AuthState = {
  error?: string;
  needEmailConfirmation?: boolean;
};

const emailSchema = z.string().trim().toLowerCase().email();

export async function createShop(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const shopName = String(formData.get("shopName") ?? "").trim();
  const phoneInput = String(formData.get("phone") ?? "").trim();
  const primaryCategoryId = String(formData.get("businessCategory") ?? "");
  const allCategoryIds = formData
    .getAll("businessCategories")
    .map(String)
    .filter(Boolean);
  const subdomainInput = String(formData.get("subdomain") ?? "").trim();
  const primaryColor = String(formData.get("primaryColor") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const bannerUrl = String(formData.get("bannerUrl") ?? "").trim();
  const terms = formData.get("terms") === "on";

  if (!email.success) return { error: "Enter a valid email address." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (name.length < 2) return { error: "Enter your full name." };
  if (shopName.length < 2) return { error: "Enter your shop name." };
  if (!terms) return { error: "Accept the terms to continue." };
  if (!primaryCategoryId) {
    return { error: "Select at least one category for your shop." };
  }

  const subdomain = normalizeSubdomain(subdomainInput);
  if (!subdomain || !isValidSubdomain(subdomain)) {
    return {
      error: "That storefront link isn't valid. Use letters, numbers and hyphens.",
    };
  }
  if (RESERVED_SUBDOMAINS.has(subdomain)) {
    return { error: "That storefront link is reserved." };
  }

  const phone = phoneInput
    ? phoneInput.startsWith("+")
      ? phoneInput
      : `+233${phoneInput.replace(/\D/g, "")}`
    : null;

  const admin = createAdminClient();

  const validIds = allCategoryIds.length > 0 ? allCategoryIds : [primaryCategoryId];
  const { data: categories } = await admin
    .from("business_categories")
    .select("id, slug")
    .in("id", validIds)
    .eq("available", true);
  if (!categories || categories.length === 0) {
    return { error: "Select a valid category for your shop." };
  }
  const category = categories.find((c) => c.id === primaryCategoryId) ?? categories[0];
  const preset = getCategoryPreset(category.slug);

  const { data: taken } = await admin
    .from("tenants")
    .select("id")
    .eq("subdomain", subdomain)
    .maybeSingle();
  if (taken) return { error: "That storefront link is already taken." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password,
    options: {
      data: { full_name: name, phone },
    },
  });
  if (error) return { error: error.message };
  if (!data.user) return { error: "Couldn't create your account." };

  // Ensure the auth user exists in auth.users before inserting into tenants.
  // signUp may return a user object before the row is fully committed
  // (e.g. when email confirmation is required), which causes FK violations.
  const { data: adminUser } = await admin.auth.admin.getUserById(data.user.id);
  if (!adminUser?.user) {
    const { error: createErr } = await admin.auth.admin.createUser({
      id: data.user.id,
      email: email.data!,
      password,
      email_confirm: true,
      user_metadata: { full_name: name, phone },
    });
    if (createErr) return { error: createErr.message };
  }

  const { data: existingTenant } = await admin
    .from("tenants")
    .select("id, subdomain")
    .eq("owner_id", data.user.id)
    .maybeSingle();

  let tenantId: string;

  if (existingTenant) {
    tenantId = existingTenant.id;
    const { error: updateErr } = await admin
      .from("tenants")
      .update({
        name: shopName,
        business_category_id: primaryCategoryId,
        business_category_ids: validIds,
        branding: {
          primaryColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor)
            ? primaryColor
            : preset.palette.primary,
          accentColor: preset.palette.accent,
        },
        contact_info: { phone: phone ?? undefined },
      })
      .eq("id", tenantId);
    if (updateErr) return { error: updateErr.message };
  } else {
    const { data: newTenant, error: tenantError } = await admin
      .from("tenants")
      .insert({
        owner_id: data.user.id,
        name: shopName,
        slug: subdomain,
        subdomain,
        business_category_id: primaryCategoryId,
        business_category_ids: validIds,
        status: "onboarding",
        subscription_tier: "free",
        branding: {
          primaryColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor)
            ? primaryColor
            : preset.palette.primary,
          accentColor: preset.palette.accent,
        },
        contact_info: { phone: phone ?? undefined },
      })
      .select("id")
      .single();
    if (tenantError) return { error: tenantError.message };
    tenantId = newTenant.id;
  }

  if (!data.session) {
    return { needEmailConfirmation: true };
  }

  const logo = formData.get("logo");
  const banner = formData.get("banner");
  let uploadedLogo: string | undefined;
  let uploadedBanner: string | undefined;

  if (logo instanceof File && logo.size > 0) {
    const { error: upError } = await admin.storage
      .from("tenant-assets")
      .upload(`${tenantId}/logo`, logo, {
        upsert: true,
        cacheControl: "3600",
        contentType: logo.type,
      });
    if (!upError) {
      uploadedLogo = admin.storage
        .from("tenant-assets")
        .getPublicUrl(`${tenantId}/logo`).data.publicUrl;
    }
  }

  if (banner instanceof File && banner.size > 0) {
    const { error: upError } = await admin.storage
      .from("tenant-assets")
      .upload(`${tenantId}/banner`, banner, {
        upsert: true,
        cacheControl: "3600",
        contentType: banner.type,
      });
    if (!upError) {
      uploadedBanner = admin.storage
        .from("tenant-assets")
        .getPublicUrl(`${tenantId}/banner`).data.publicUrl;
    }
  }

  if (uploadedLogo || uploadedBanner) {
    await admin
      .from("tenants")
      .update({
        branding: {
          primaryColor: /^#[0-9a-fA-F]{6}$/.test(primaryColor)
            ? primaryColor
            : preset.palette.primary,
          accentColor: preset.palette.accent,
          logoUrl: uploadedLogo ?? (logoUrl || undefined),
          bannerUrl: uploadedBanner ?? (bannerUrl || undefined),
        },
      })
      .eq("id", tenantId);
  }

  redirect("/onboarding");
}

export async function signUp(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();

  if (!email.success) return { error: "Enter a valid email address." };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.data,
    password,
    options: { data: { full_name: name } },
  });

  if (error) return { error: error.message };
  if (!data.session) {
    return { needEmailConfirmation: true };
  }
  redirect("/onboarding");
}

export async function logIn(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
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
  redirect("/onboarding");
}

export async function logOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export type ResetState = {
  error?: string;
  sent?: boolean;
};

export async function resetPassword(
  prevState: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/update-password`,
  });

  if (error) return { error: error.message };
  return { sent: true };
}

export type UpdatePasswordState = {
  error?: string;
  done?: boolean;
};

export async function updatePassword(
  prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (password !== confirm) {
    return { error: "Passwords don't match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message };
  return { done: true };
}

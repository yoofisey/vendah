import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/tenant";

// Only allow redirecting to internal platform paths (prevents open redirects
// via a malicious `next` param after an OAuth exchange).
function isSafeNextPath(next: string): boolean {
  if (!next.startsWith("/") || next.startsWith("//")) return false;
  if (next.startsWith("/api")) return false;
  return true;
}

// OAuth and magic-link users land here without a tenant (email+password sign-up
// provisions one in createShop). Mirror that: create an onboarding tenant so the
// wizard continues instead of re-signing up. Best-effort — if it fails the
// wizard still creates the tenant on first save.
async function provisionTenant(user: User) {
  if (!user?.id || !user.email) return;

  const admin = createAdminClient();
  const existing = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing.data) return;

  const { data: category } = await admin
    .from("business_categories")
    .select("id")
    .eq("slug", "other")
    .eq("available", true)
    .maybeSingle();
  if (!category) return;

  const fullName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    "";
  const name = fullName.trim().slice(0, 60) || "My shop";
  const base = slugify(name) || "shop";

  let slug = base;
  for (let i = 0; i < 5; i++) {
    if (i > 0) slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const taken = await admin
      .from("tenants")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!taken.data) break;
    slug = "";
  }
  if (!slug) slug = `${base}-${Date.now().toString(36)}`;

  await admin.from("tenants").insert({
    owner_id: user.id,
    name,
    slug,
    business_category_id: category.id,
    business_category_ids: [category.id],
    status: "onboarding",
    subscription_tier: "free",
    branding: { primaryColor: "#1b4332", accentColor: "#d4a017" },
  });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/onboarding";
  const next = isSafeNextPath(requestedNext) ? requestedNext : "/onboarding";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        try {
          await provisionTenant(data.user);
        } catch {
          // provisioning is best-effort; the wizard creates the tenant on save
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/sign-in?error=auth`);
}

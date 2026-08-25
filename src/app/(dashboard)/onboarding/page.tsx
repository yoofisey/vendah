import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "./onboarding-wizard";
import { PaymentStatus } from "./payment-status";
import type { BusinessCategory, SubscriptionTier, Tenant } from "@/lib/types";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (!user) redirect("/sign-in");

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("business_categories")
    .select("id, slug, name, available, sort_order")
    .eq("available", true)
    .order("sort_order");

  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (tenant?.status === "active") redirect("/dashboard");

  let awaitingPayment = false;
  if (tenant) {
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("tier, status")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    awaitingPayment =
      subscription?.status === "trialing" &&
      (subscription.tier as SubscriptionTier) !== "free";
  }

  if (awaitingPayment) return <PaymentStatus />;

  return (
    <OnboardingWizard
      categories={(categories as BusinessCategory[]) ?? []}
      tenant={(tenant as Tenant) ?? null}
    />
  );
}

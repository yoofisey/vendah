import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { getPaystackBanks } from "@/lib/paystack";
import { PLANS } from "@/lib/plans";
import { createClient } from "@/lib/supabase/server";
import type { BillingCycle, SubscriptionTier } from "@/lib/types";
import { ConnectPaystackForm } from "./connect-paystack-form";
import { SecurityForm } from "./security-form";
import { SettingsForm } from "./settings-form";
import { PlanManager } from "./plan-manager";
import { PayoutCard } from "./payout-card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const plan = PLANS[tenant.subscription_tier];

  const supabase = await createClient();
  const [subscriptionRes, txsRes, allCategoriesRes] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("billing_cycle, status, current_period_end")
      .eq("tenant_id", tenant.id)
      .maybeSingle(),
    supabase
      .from("transactions")
      .select("id, amount_minor, currency, created_at")
      .eq("tenant_id", tenant.id)
      .eq("status", "success")
      .not("order_id", "is", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("business_categories")
      .select("id, slug, name, available")
      .eq("available", true)
      .order("sort_order"),
  ]);

  const balanceMinor = (txsRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount_minor),
    0
  );

  let banks: { code: string; name: string }[] = [];
  try {
    banks = await getPaystackBanks();
  } catch {
    banks = [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold text-charcoal">
          Store Settings
        </h1>
        <p className="mt-1 text-sm text-muted">
          Branding, contact details and your payments connection.
        </p>
      </div>

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
        />
        <h2 className="relative mb-5 font-heading text-lg font-semibold text-charcoal">
          Your plan
        </h2>
        <PlanManager
          currentTier={tenant.subscription_tier as SubscriptionTier}
          currentCycle={(subscriptionRes.data?.billing_cycle as BillingCycle) ?? "monthly"}
          periodEnd={subscriptionRes.data?.current_period_end ?? null}
          subStatus={subscriptionRes.data?.status ?? null}
        />
      </section>

      <SettingsForm
        tenant={tenant}
        subdomain={tenant.subdomain ?? ""}
        allCategories={(allCategoriesRes.data ?? []) as {
          id: string;
          slug: string;
          name: string;
        }[]}
      />

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
        />
        <div className="relative">
          <h2 className="font-heading text-lg font-semibold text-charcoal">
            Security
          </h2>
          <p className="mt-1 text-sm text-muted">
            Update the password you use to sign in to your dashboard.
          </p>
        </div>
        <div className="relative mt-5 max-w-lg">
          <SecurityForm />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <PayoutCard
          balanceMinor={balanceMinor}
          momoNumber={tenant.contact_info?.phone ?? "Not linked"}
          history={(txsRes.data ?? []).slice(0, 5)}
        />

        <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
          />
          <h2 className="relative font-heading text-lg font-semibold text-charcoal">
            Payments (Paystack)
          </h2>
          <p className="relative mt-1 text-sm text-muted">
            Receive payments from your customers straight into your bank
            account. We handle the checkout on your storefront.
          </p>
          <div className="relative mt-4">
            <ConnectPaystackForm
              banks={banks}
              existingCode={tenant.paystack_subaccount_code}
              salesFeePct={plan.salesFeePct}
              payoutVerified={tenant.payout_verified ?? false}
              payoutVerifiedName={tenant.payout_verified_name ?? null}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

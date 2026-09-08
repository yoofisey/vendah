import Link from "next/link";
import { logOut } from "@/app/(auth)/actions";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { downgradeToFree, isSubscriptionExpired, type SubscriptionRow } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";
import { DashboardChrome } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const tenant = await getCurrentTenant();

  if (tenant?.status === "active") {
    const supabase = await createClient();
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", tenant.id)
      .maybeSingle();
    const sub = (subscription as SubscriptionRow | null) ?? null;
    if (sub && isSubscriptionExpired(sub)) {
      await downgradeToFree(
        tenant.id,
        sub.provider_subscription_id,
        tenant.paystack_subaccount_code
      );
    }
  }

  let pendingOrderCount = 0;
  if (tenant?.status === "active") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id)
      .in("status", ["pending", "paid"]);
    pendingOrderCount = count ?? 0;
  }

  if (tenant?.status !== "active") {
    return (
      <div className="min-h-screen bg-cream bg-[radial-gradient(56rem_38rem_at_105%_-8%,rgba(212,160,23,0.12),transparent_60%),radial-gradient(48rem_36rem_at_-8%_108%,rgba(27,67,50,0.1),transparent_55%)]">
        <header className="sticky top-0 z-10 border-b border-charcoal/5 bg-cream/85 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine">
                <span className="h-2 w-2 rounded-full bg-gold" />
              </span>
              <span className="font-heading text-lg font-semibold tracking-tight text-charcoal">
                venfii<span className="text-gold">.</span>
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted">{user.email}</span>
              <form action={logOut}>
                <button
                  type="submit"
                  className="text-sm font-medium text-muted transition duration-200 hover:text-charcoal"
                >
                  Log out
                </button>
              </form>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <DashboardChrome tenantName={tenant.name} tenantSubdomain={tenant.subdomain ?? ""} tenantTier={tenant.subscription_tier} userEmail={user.email ?? ""} pendingOrderCount={pendingOrderCount}>
      {children}
    </DashboardChrome>
  );
}

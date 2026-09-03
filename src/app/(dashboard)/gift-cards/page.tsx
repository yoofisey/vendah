import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { GiftCardForm } from "./gift-card-form";
import { GiftCardActions } from "./gift-card-actions";

export default async function GiftCardsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: cards } = await supabase
    .from("gift_cards")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const list = cards ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Gift Cards
          </h1>
          <p className="mt-2 text-sm text-muted">
            Issue store credit customers redeem at checkout towards their order.
          </p>
        </div>
        <GiftCardForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No gift cards yet. Issue your first one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Value</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Expires</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((gc) => {
                  const now = new Date();
                  const isExpired =
                    gc.expires_at && new Date(gc.expires_at) < now;
                  const isUpcoming =
                    gc.starts_at && new Date(gc.starts_at) > now;
                  const statusLabel =
                    gc.status === "disabled"
                      ? "Disabled"
                      : gc.status === "redeemed"
                        ? "Redeemed"
                        : isExpired
                          ? "Expired"
                          : isUpcoming
                            ? "Scheduled"
                            : "Active";
                  const statusColor =
                    gc.status === "disabled" ||
                    gc.status === "redeemed" ||
                    isExpired
                      ? "text-muted"
                      : isUpcoming
                        ? "text-amber-600"
                        : "text-pine";

                  return (
                    <tr
                      key={gc.id}
                      className="transition duration-150 hover:bg-cream-soft/40"
                    >
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-md bg-pine/10 px-2.5 py-1 font-mono text-sm font-semibold text-pine">
                          {gc.code}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-charcoal">
                        {formatMoney(gc.initial_value_minor, "GHS")}
                      </td>
                      <td className="px-6 py-5 text-sm text-charcoal-soft">
                        {formatMoney(gc.balance_minor, "GHS")}
                      </td>
                      <td className="px-6 py-5 text-sm text-muted">
                        {gc.expires_at
                          ? new Date(gc.expires_at).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-sm font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <GiftCardActions id={gc.id} status={gc.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
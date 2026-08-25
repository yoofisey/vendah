import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { DiscountCodeForm } from "./discount-code-form";
import { DiscountActions } from "./discount-actions";

export default async function DiscountsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: codes } = await supabase
    .from("discount_codes")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const list = codes ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Discount Codes
          </h1>
          <p className="mt-2 text-sm text-muted">
            Create codes customers can apply at checkout for discounts.
          </p>
        </div>
        <DiscountCodeForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No discount codes yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4">Discount</th>
                  <th className="px-6 py-4">Min. Order</th>
                  <th className="px-6 py-4">Usage</th>
                  <th className="px-6 py-4">Expires</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((dc) => {
                  const now = new Date();
                  const isExpired = dc.expires_at && new Date(dc.expires_at) < now;
                  const isUpcoming = dc.starts_at && new Date(dc.starts_at) > now;
                  const statusLabel = !dc.active
                    ? "Disabled"
                    : isExpired
                      ? "Expired"
                      : isUpcoming
                        ? "Scheduled"
                        : "Active";
                  const statusColor = !dc.active || isExpired
                    ? "text-muted"
                    : isUpcoming
                      ? "text-amber-600"
                      : "text-pine";

                  return (
                    <tr
                      key={dc.id}
                      className="transition duration-150 hover:bg-cream-soft/40"
                    >
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-md bg-pine/10 px-2.5 py-1 font-mono text-sm font-semibold text-pine">
                          {dc.code}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm font-medium text-charcoal">
                        {dc.discount_type === "percent"
                          ? `${dc.value}%`
                          : formatMoney(dc.value, "GHS")}
                      </td>
                      <td className="px-6 py-5 text-sm text-charcoal-soft">
                        {dc.min_order_minor > 0
                          ? formatMoney(dc.min_order_minor, "GHS")
                          : "—"}
                      </td>
                      <td className="px-6 py-5 text-sm text-charcoal-soft">
                        {dc.used_count}
                        {dc.max_uses ? ` / ${dc.max_uses}` : ""}
                      </td>
                      <td className="px-6 py-5 text-sm text-muted">
                        {dc.expires_at
                          ? new Date(dc.expires_at).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-sm font-medium ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <DiscountActions id={dc.id} active={dc.active} />
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

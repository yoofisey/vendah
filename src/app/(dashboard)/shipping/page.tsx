import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ZoneForm } from "./zone-form";
import { ZoneActions } from "./zone-actions";

export default async function ShippingPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: zones } = await supabase
    .from("shipping_zones")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sort_order", { ascending: true });

  const list = zones ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Shipping Zones
          </h1>
          <p className="mt-2 text-sm text-muted">
            Define delivery fees and free-shipping thresholds for different areas.
          </p>
        </div>
        <ZoneForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No shipping zones yet. Add your first zone to start charging delivery fees.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Fee</th>
                  <th className="px-6 py-4">Free above</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((zone) => (
                  <tr
                    key={zone.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-charcoal">
                      {zone.name}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {zone.fee_minor === 0 ? (
                        <span className="text-pine font-medium">Free</span>
                      ) : (
                        formatMoney(zone.fee_minor, "GHS")
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {zone.free_above_minor
                        ? formatMoney(zone.free_above_minor, "GHS")
                        : "—"}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-sm font-medium ${
                          zone.active ? "text-pine" : "text-muted"
                        }`}
                      >
                        {zone.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <ZoneActions
                        id={zone.id}
                        active={zone.active}
                        name={zone.name}
                        feeMinor={zone.fee_minor}
                        freeAboveMinor={zone.free_above_minor}
                        sortOrder={zone.sort_order}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

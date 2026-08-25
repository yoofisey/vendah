import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TaxRateForm } from "./tax-form";
import { TaxActions } from "./tax-actions";

const appliesToLabel: Record<string, string> = {
  all: "All products",
  physical: "Physical products",
  digital: "Digital products",
};

export default async function TaxPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: rates } = await supabase
    .from("tax_rates")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const list = rates ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Tax Rates
          </h1>
          <p className="mt-2 text-sm text-muted">
            Configure tax rates that apply to your products at checkout.
          </p>
        </div>
        <TaxRateForm />
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No tax rates yet. Create your first one to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Rate</th>
                  <th className="px-6 py-4">Applies to</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((tr) => (
                  <tr
                    key={tr.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-charcoal">
                      {tr.name}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {(tr.rate_pct / 100).toFixed(2)}%
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {appliesToLabel[tr.applies_to] ?? tr.applies_to}
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`text-sm font-medium ${
                          tr.active ? "text-pine" : "text-muted"
                        }`}
                      >
                        {tr.active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <TaxActions id={tr.id} active={tr.active} />
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

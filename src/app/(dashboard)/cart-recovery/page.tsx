import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/format";
import { ResendRecoveryButton } from "./resend-button";

type RecoveryLog = {
  id: string;
  email: string;
  items_json: { productId: string; name: string; priceMinor: number; currency: string; quantity: number }[];
  total_minor: number;
  recovered: boolean;
  sent_at: string;
  recovered_at: string | null;
};

export default async function CartRecoveryPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("cart_recovery_logs")
    .select("*")
    .eq("tenant_id", tenant.id)
    .order("sent_at", { ascending: false });

  const list = (logs ?? []) as RecoveryLog[];

  const totalRecoveries = list.length;
  const recoveredCount = list.filter((l) => l.recovered).length;
  const recoveryRate = totalRecoveries > 0 ? Math.round((recoveredCount / totalRecoveries) * 100) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">
          Cart Recovery
        </h1>
        <p className="mt-2 text-sm text-muted">
          Track abandoned cart recovery emails sent to customers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/70 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-muted">Total Recovery Emails</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-charcoal">{totalRecoveries}</p>
        </div>
        <div className="rounded-xl border border-white/70 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-muted">Recovered</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-pine">{recoveredCount}</p>
        </div>
        <div className="rounded-xl border border-white/70 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-muted">Recovery Rate</p>
          <p className="mt-2 font-heading text-3xl font-semibold text-charcoal">{recoveryRate}%</p>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No recovery emails sent yet.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Sent</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((log) => (
                  <tr
                    key={log.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5 text-sm font-medium text-charcoal">
                      {log.email}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {log.items_json.reduce((sum, i) => sum + i.quantity, 0)}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {formatMoney(log.total_minor, log.items_json[0]?.currency)}
                    </td>
                    <td className="px-6 py-5 text-sm text-muted">
                      {new Date(log.sent_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5">
                      <span className={`text-sm font-medium ${log.recovered ? "text-pine" : "text-muted"}`}>
                        {log.recovered ? "Recovered" : "Pending"}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      {!log.recovered && <ResendRecoveryButton id={log.id} />}
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

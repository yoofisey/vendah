import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function ReturnsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: returns } = await supabase
    .from("return_requests")
    .select("*, orders!inner(id, reference, customer_name, customer_email)")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const pendingCount = (returns ?? []).filter((r) => r.status === "pending").length;
  const approvedCount = (returns ?? []).filter((r) => r.status === "approved").length;
  const rejectedCount = (returns ?? []).filter((r) => r.status === "rejected").length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">
          Returns & Refunds
        </h1>
        <p className="mt-1 text-sm text-muted">
          Manage return requests and refund orders.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <p className="text-sm text-muted">Pending</p>
          <p className="mt-1 text-2xl font-bold text-charcoal">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <p className="text-sm text-muted">Approved</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{approvedCount}</p>
        </div>
        <div className="rounded-xl border border-white/70 bg-white p-5 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <p className="text-sm text-muted">Rejected</p>
          <p className="mt-1 text-2xl font-bold text-red-600">{rejectedCount}</p>
        </div>
      </div>

      <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        {(returns ?? []).length === 0 ? (
          <p className="text-sm text-muted">No return requests yet.</p>
        ) : (
          <ul className="divide-y divide-charcoal/10">
            {(returns ?? []).map((req) => {
              const order = req.orders as { id: string; reference: string; customer_name: string; customer_email: string } | null;
              return (
                <li key={req.id} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-charcoal">
                      {order?.reference ?? "Unknown order"}
                    </p>
                    <p className="text-xs text-muted">
                      {order?.customer_name} · {order?.customer_email}
                    </p>
                    <p className="mt-1 text-xs text-muted line-clamp-1">{req.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        req.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : req.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.status}
                    </span>
                    {order?.id && (
                      <a
                        href={`/orders/${order.id}`}
                        className="text-xs text-pine underline-offset-4 hover:underline"
                      >
                        View order
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

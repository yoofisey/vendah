import { redirect } from "next/navigation";
import { BanknotesIcon } from "@heroicons/react/24/outline";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type TxStatus = "success" | "failed" | "pending";

export default async function PaymentsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .eq("tenant_id", tenant.id)
    .not("order_id", "is", null)
    .order("created_at", { ascending: false });
  const transactions = data ?? [];

  const totalCollected = transactions.reduce(
    (sum, tx) =>
      tx.status === "success"
        ? sum + Number(tx.amount_minor ?? 0)
        : sum,
    0
  );
  const successfulCount = transactions.filter(
    (tx) => tx.status === "success"
  ).length;
  const failedCount = transactions.filter((tx) => tx.status === "failed").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">
          Payments
        </h1>
        <p className="mt-2 text-sm text-muted">
          Payment transactions from your storefront.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard
          label="Total collected"
          value={formatMoney(totalCollected)}
          sub={`${successfulCount} successful ${
            successfulCount === 1 ? "payment" : "payments"
          }`}
        />
        <StatCard
          label="Pending"
          value={formatMoney(
            transactions.reduce(
              (sum, tx) =>
                tx.status === "pending"
                  ? sum + Number(tx.amount_minor ?? 0)
                  : sum,
              0
            )
          )}
          sub="Awaiting confirmation"
        />
        <StatCard
          label="Failed"
          value={String(failedCount)}
          sub={`${transactions.length - successfulCount - failedCount} still open`}
        />
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream">
            <BanknotesIcon className="h-7 w-7 text-muted" />
          </span>
          <p className="mt-4 text-sm text-muted">
            No payments yet. They&apos;ll appear once customers check out.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <ul className="divide-y divide-charcoal/10">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex items-center gap-5 p-5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-charcoal">
                    {tx.provider_reference ?? tx.provider}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(tx.created_at).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span className="font-semibold text-charcoal">
                  {formatMoney(tx.amount_minor, tx.currency)}
                </span>
                <TxBadge status={tx.status as TxStatus} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-6 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
      />
      <p className="relative text-xs font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p className="relative mt-2 font-heading text-3xl font-semibold text-charcoal">
        {value}
      </p>
      <p className="relative mt-1 text-xs text-muted">{sub}</p>
    </div>
  );
}

function TxBadge({ status }: { status: TxStatus }) {
  const styles: Record<TxStatus, string> = {
    success: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

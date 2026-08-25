import { redirect } from "next/navigation";
import { UsersIcon } from "@heroicons/react/24/outline";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered", "fulfilled"];

export default async function CustomersPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select("customer_name, customer_email, customer_phone, total_minor, status, created_at")
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false });

  const orders = data ?? [];
  const customers = new Map<
    string,
    {
      name: string;
      email: string;
      phone: string;
      orders: number;
      spend: number;
      lastOrder: string;
    }
  >();

  for (const order of orders) {
    const key = (order.customer_email ?? order.customer_phone ?? order.customer_name).toLowerCase();
    const existing = customers.get(key) ?? {
      name: order.customer_name,
      email: order.customer_email ?? "",
      phone: order.customer_phone ?? "",
      orders: 0,
      spend: 0,
      lastOrder: order.created_at,
    };
    existing.orders += 1;
    if (REVENUE_STATUSES.includes(order.status)) {
      existing.spend += Number(order.total_minor);
    }
    if (order.created_at > existing.lastOrder) existing.lastOrder = order.created_at;
    customers.set(key, existing);
  }

  const list = [...customers.values()].sort(
    (a, b) => b.orders - a.orders || b.spend - a.spend
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">
          Customers
        </h1>
        <p className="mt-2 text-sm text-muted">
          The people shopping with you, grouped by contact.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-cream">
            <UsersIcon className="h-7 w-7 text-muted" />
          </span>
          <p className="mt-4 text-sm text-muted">
            No customers yet. They&apos;ll appear once orders come in.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Orders</th>
                  <th className="px-6 py-4">Total Spend</th>
                  <th className="px-6 py-4">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {list.map((customer, i) => (
                  <tr
                    key={customer.email || customer.phone || i}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pine/10 text-xs font-semibold text-pine">
                          {customer.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-charcoal">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {customer.email && (
                        <p className="text-sm text-charcoal-soft">
                          {customer.email}
                        </p>
                      )}
                      {customer.phone && (
                        <p className="text-xs text-muted">
                          {customer.phone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm font-medium text-charcoal">
                      {customer.orders}
                    </td>
                    <td className="px-6 py-5 font-semibold text-charcoal">
                      {formatMoney(customer.spend, "GHS")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-muted">
                      {new Date(customer.lastOrder).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
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

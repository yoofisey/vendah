import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}) {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const params = await searchParams;
  const activeStatus = params.status ?? "all";
  const page = Math.max(1, Number(params.page ?? "1") || 1);
  const q = (params.q ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("id, customer_name, customer_email, total_minor, currency, status, delivery_method, created_at", {
      count: "exact",
    })
    .eq("tenant_id", tenant.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }
  if (q) {
    const term = escapeLike(q);
    query = query.or(
      `customer_name.ilike.%${term}%,customer_email.ilike.%${term}%`
    );
  }

  const { data, count } = await query;
  const orders = data ?? [];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const { data: items } = await supabase
    .from("order_items")
    .select("order_id")
    .in("order_id", orders.map((o) => o.id));
  const itemCounts = new Map<string, number>();
  for (const item of items ?? []) {
    itemCounts.set(item.order_id, (itemCounts.get(item.order_id) ?? 0) + 1);
  }

  const tabs = ["all", ...ORDER_STATUSES];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Orders
          </h1>
          <p className="mt-2 text-sm text-muted">
            Orders placed through your storefront.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab}
              href={ordersHref(tab, 1, q)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition duration-200 ${
                activeStatus === tab
                  ? "bg-pine text-white shadow-lg shadow-pine/25"
                  : "border border-charcoal/10 bg-white/80 text-charcoal-soft backdrop-blur hover:bg-white hover:shadow-sm"
              }`}
            >
              {tab === "all" ? "All" : tab}
            </Link>
          ))}
        </div>

        <form
          method="get"
          action="/orders"
          className="flex min-w-0 items-center gap-2"
        >
          <input
            type="hidden"
            name="status"
            value={activeStatus === "all" ? "" : activeStatus}
          />
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search customer…"
              aria-label="Search orders by customer"
              className="w-56 rounded-lg border border-charcoal/15 bg-white py-2 pl-9 pr-3 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-pine focus:outline-none focus:ring-2 focus:ring-pine/20 sm:w-64"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white shadow-md shadow-pine/20 transition duration-150 hover:bg-pine-dark"
          >
            Search
          </button>
        </form>
      </div>

      {q && (
        <p className="text-sm text-muted">
          {count ?? 0} result{count === 1 ? "" : "s"} for &ldquo;{q}&rdquo;.{" "}
          <Link
            href={ordersHref(activeStatus, 1, "")}
            className="font-semibold text-pine underline-offset-4 hover:underline"
          >
            Clear search
          </Link>
        </p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            {q
              ? `No orders match "${q}".`
              : activeStatus === "all"
                ? "No orders yet. Once customers buy, orders will show up here."
                : `No ${activeStatus} orders.`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Items</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Collection</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-5 font-mono text-xs font-semibold text-charcoal">
                      {orderRef(order.id)}
                    </td>
                    <td className="px-6 py-5">
                      <p className="truncate text-sm font-medium text-charcoal">
                        {order.customer_name}
                      </p>
                      {order.customer_email && (
                        <p className="truncate text-xs text-muted">
                          {order.customer_email}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-5 text-sm text-charcoal-soft">
                      {itemCounts.get(order.id) ?? 0}
                    </td>
                    <td className="px-6 py-5 font-semibold text-charcoal">
                      {formatMoney(order.total_minor, order.currency)}
                    </td>
                    <td className="px-6 py-5 text-sm capitalize text-charcoal-soft">
                      {order.delivery_method ?? "pickup"}
                    </td>
                    <td className="px-6 py-5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-5 text-sm text-muted">
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded-lg border border-charcoal/10 bg-white px-3 py-1.5 text-xs font-semibold text-charcoal transition duration-150 hover:bg-cream"
                        >
                          View
                        </Link>
                        <Link
                          href={`/orders/${order.id}`}
                          className="flex items-center gap-1 rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-pine/20 transition duration-150 hover:bg-pine-dark"
                        >
                          <ArrowPathIcon className="h-3.5 w-3.5" />
                          Update
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-charcoal/10 px-6 py-4">
              <p className="text-xs text-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Link
                  href={ordersHref(activeStatus, page - 1, q)}
                  aria-disabled={page <= 1}
                  className={`flex items-center gap-1 rounded-lg border border-charcoal/10 px-3 py-1.5 text-xs font-semibold transition duration-150 ${
                    page <= 1
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-cream"
                  }`}
                >
                  <ArrowLeftIcon className="h-3.5 w-3.5" /> Previous
                </Link>
                <Link
                  href={ordersHref(activeStatus, page + 1, q)}
                  aria-disabled={page >= totalPages}
                  className={`flex items-center gap-1 rounded-lg border border-charcoal/10 px-3 py-1.5 text-xs font-semibold transition duration-150 ${
                    page >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-cream"
                  }`}
                >
                  Next <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ordersHref(status: string, page: number, q: string): string {
  const params = new URLSearchParams();
  if (status && status !== "all") params.set("status", status);
  if (page > 1) params.set("page", String(page));
  if (q) params.set("q", q);
  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

function escapeLike(value: string): string {
  return value.replace(/([\\*?%_])/g, "\\$1");
}

export function orderRef(orderId: string): string {
  return `#${orderId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    paid: "bg-emerald-100 text-emerald-700",
    processing: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    fulfilled: "bg-blue-100 text-blue-700",
    cancelled: "bg-red-100 text-red-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status] ?? "bg-charcoal/10 text-muted"}`}
    >
      {status}
    </span>
  );
}

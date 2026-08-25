import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  EyeIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { DateRangePicker } from "./date-range-picker";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered", "fulfilled"];
const DAY_MS = 24 * 60 * 60 * 1000;

function getDefaultRange() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now.getTime() - 30 * DAY_MS).toISOString().slice(0, 10);
  return { from, to };
}

function getPreviousRange(from: string, to: string) {
  const fromDate = new Date(from + "T00:00:00Z");
  const toDate = new Date(to + "T00:00:00Z");
  const duration = toDate.getTime() - fromDate.getTime();
  const prevTo = new Date(fromDate.getTime() - 1).toISOString();
  const prevFrom = new Date(fromDate.getTime() - duration).toISOString();
  return { prevFrom, prevTo };
}

function daysBetween(from: string, to: string) {
  const diff = new Date(to + "T00:00:00Z").getTime() - new Date(from + "T00:00:00Z").getTime();
  return Math.max(1, Math.round(diff / DAY_MS) + 1);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const params = await searchParams;
  const defaults = getDefaultRange();
  const from = params.from ?? defaults.from;
  const to = params.to ?? defaults.to;
  const fromISO = from + "T00:00:00Z";
  const toISO = to + "T23:59:59Z";
  const { prevFrom, prevTo } = getPreviousRange(from, to);
  const numDays = daysBetween(from, to);

  const supabase = await createClient();

  const { data: ordersData } = await supabase
    .from("orders")
    .select("id, total_minor, currency, status, created_at")
    .eq("tenant_id", tenant.id);

  const allOrders = ordersData ?? [];

  const paidOrders = allOrders.filter((o) => REVENUE_STATUSES.includes(o.status));
  const currentPaid = paidOrders.filter(
    (o) => o.created_at >= fromISO && o.created_at <= toISO
  );
  const previousPaid = paidOrders.filter(
    (o) => o.created_at >= prevFrom && o.created_at <= prevTo
  );
  const currentAll = allOrders.filter(
    (o) => o.created_at >= fromISO && o.created_at <= toISO
  );

  const sumMinor = (list: { total_minor: number }[]) =>
    list.reduce((s, o) => s + Number(o.total_minor), 0);

  const recentRevenue = sumMinor(currentPaid);
  const previousRevenue = sumMinor(previousPaid);
  const revenueChange = pctChange(recentRevenue, previousRevenue);

  const avgOrderValue =
    currentPaid.length > 0 ? Math.round(recentRevenue / currentPaid.length) : 0;

  const statusBreakdown = {
    pending: currentAll.filter((o) => o.status === "pending").length,
    paid: currentAll.filter((o) => o.status === "paid").length,
    shipped: currentAll.filter((o) => o.status === "shipped").length,
    delivered: currentAll.filter((o) => o.status === "delivered").length,
  };

  const dailyRevenue = buildDailySeries(currentPaid, numDays);

  const topProducts = await getTopProducts(tenant.id, currentPaid);

  const { data: pvData } = await supabase
    .from("page_views")
    .select("id, path")
    .eq("tenant_id", tenant.id)
    .gte("created_at", fromISO)
    .lte("created_at", toISO);

  const pageViews = pvData ?? [];
  const totalPageViews = pageViews.length;

  const pathCounts = new Map<string, number>();
  for (const pv of pageViews) {
    pathCounts.set(pv.path, (pathCounts.get(pv.path) ?? 0) + 1);
  }
  const topPages = Array.from(pathCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-charcoal">
          Analytics
        </h1>
        <p className="mt-2 text-sm text-muted">
          Performance overview for {from} to {to}.
        </p>
      </div>

      <Suspense>
        <DateRangePicker />
      </Suspense>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label={`Revenue (${numDays}d)`}
          value={formatMoney(recentRevenue, "GHS")}
          delta={revenueChange}
          icon={<BanknotesIcon className="h-5 w-5" />}
        />
        <KpiCard
          label="Total Orders"
          value={String(currentAll.length)}
          delta={pctChange(currentAll.length, allOrders.filter((o) => o.created_at >= prevFrom && o.created_at <= prevTo).length)}
          icon={<ShoppingBagIcon className="h-5 w-5" />}
        />
        <KpiCard
          label="Avg. Order Value"
          value={formatMoney(avgOrderValue, "GHS")}
          delta={null}
          icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        />
        <KpiCard
          label={`Paid (${numDays}d)`}
          value={String(currentPaid.length)}
          delta={pctChange(currentPaid.length, previousPaid.length)}
          icon={<BanknotesIcon className="h-5 w-5" />}
        />
        <KpiCard
          label="Page Views"
          value={String(totalPageViews)}
          delta={null}
          icon={<EyeIcon className="h-5 w-5" />}
        />
      </div>

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gold/[0.08] blur-2xl"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-semibold text-charcoal">
              Revenue by Day
            </h2>
            <p className="mt-1 text-sm text-muted">{from} to {to}</p>
          </div>
          <p className="font-heading text-2xl font-semibold text-pine">
            {formatMoney(recentRevenue, "GHS")}
          </p>
        </div>
        <BarChart series={dailyRevenue} />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <h2 className="font-heading text-xl font-semibold text-charcoal">
            Top Products
          </h2>
          {topProducts.length > 0 ? (
            <div className="mt-4 space-y-3">
              {topProducts.map((p, i) => (
                <div
                  key={p.product_id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine/10 text-xs font-bold text-pine">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium text-charcoal">
                      {p.name}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-charcoal">
                    {formatMoney(p.revenue, "GHS")}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">
              No paid orders in this period.
            </p>
          )}
        </section>

        <div className="space-y-5">
          <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
            <h2 className="font-heading text-xl font-semibold text-charcoal">
              Order Status
            </h2>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["pending", statusBreakdown.pending, "bg-amber-100 text-amber-700"],
                  ["paid", statusBreakdown.paid, "bg-blue-100 text-blue-700"],
                  ["shipped", statusBreakdown.shipped, "bg-purple-100 text-purple-700"],
                  [
                    "delivered",
                    statusBreakdown.delivered,
                    "bg-green-100 text-green-700",
                  ],
                ] as const
              ).map(([label, count, color]) => (
                <div key={label} className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${color}`}
                  >
                    {label}
                  </span>
                  <span className="text-sm font-medium text-charcoal">{count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
            <h2 className="font-heading text-xl font-semibold text-charcoal">
              Top Pages
            </h2>
            {topPages.length > 0 ? (
              <div className="mt-4 space-y-3">
                {topPages.map(([path, count], i) => (
                  <div key={path} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pine/10 text-xs font-bold text-pine">
                        {i + 1}
                      </span>
                      <span className="truncate text-sm font-medium text-charcoal">
                        {path}
                      </span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-charcoal">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-muted">No page views yet.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

async function getTopProducts(
  tenantId: string,
  paidOrders: { id: string }[]
): Promise<{ product_id: string; name: string; revenue: number }[]> {
  if (paidOrders.length === 0) return [];

  const supabase = await createClient();
  const orderIds = paidOrders.map((o) => o.id);

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, product_name, price_minor, quantity")
    .in("order_id", orderIds)
    .not("product_id", "is", null);

  const byProduct = new Map<
    string,
    { name: string; revenue: number }
  >();
  for (const item of items ?? []) {
    if (!item.product_id) continue;
    const existing = byProduct.get(item.product_id) ?? {
      name: item.product_name,
      revenue: 0,
    };
    existing.revenue += Number(item.price_minor) * item.quantity;
    byProduct.set(item.product_id, existing);
  }

  return Array.from(byProduct.entries())
    .map(([product_id, data]) => ({ product_id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

function buildDailySeries(
  orders: { total_minor: number; created_at: string }[],
  days: number
): { label: string; revenue: number }[] {
  const byDay = new Map<string, number>();
  for (const o of orders) {
    const d = new Date(o.created_at);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total_minor));
  }
  const today = new Date();
  const series: { label: string; revenue: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getTime() - i * DAY_MS);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    series.push({
      label: date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      }),
      revenue: byDay.get(key) ?? 0,
    });
  }
  return series;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function KpiCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: string;
  delta: number | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-6 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
      />
      <div className="relative flex items-center justify-between">
        <p className="text-sm font-medium text-muted">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pine/10 text-pine">
          {icon}
        </span>
      </div>
      <p className="mt-3 font-heading text-3xl font-semibold text-charcoal">
        {value}
      </p>
      {delta !== null && (
        <span
          className={`mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            delta >= 0
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {delta >= 0 ? (
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          ) : (
            <ArrowDownRightIcon className="h-3.5 w-3.5" />
          )}
          {Math.abs(delta)}% vs prev period
        </span>
      )}
    </div>
  );
}

function BarChart({
  series,
}: {
  series: { label: string; revenue: number }[];
}) {
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const step = 600 / series.length;

  return (
    <div className="relative mt-6">
      <svg
        viewBox="0 0 600 200"
        className="h-52 w-full"
        role="img"
        aria-label="Bar chart of daily revenue"
      >
        <line
          x1="0"
          y1="188"
          x2="600"
          y2="188"
          strokeWidth="1"
          className="stroke-charcoal/10"
        />
        {series.map((s, i) => {
          const h = Math.max(
            (s.revenue / max) * 150,
            s.revenue > 0 ? 3 : 0
          );
          const x = i * step + step * 0.2;
          const w = step * 0.6;
          return (
            <g key={i}>
              <rect
                x={x}
                y={188 - h}
                width={w}
                height={h}
                rx={2}
                className="fill-pine/70 transition duration-150 hover:fill-gold"
              >
                <title>{`${s.label}: ${formatMoney(s.revenue, "GHS")}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] font-medium uppercase tracking-wide text-muted">
        <span>{series[0]?.label}</span>
        <span>{series[Math.floor(series.length / 2)]?.label}</span>
        <span>{series[series.length - 1]?.label}</span>
      </div>
    </div>
  );
}

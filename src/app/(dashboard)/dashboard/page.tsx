import Link from "next/link";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  BanknotesIcon,
  CheckIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { TenantTheme } from "@/components/tenant-theme";
import { getCurrentTenant } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { getStorefrontUrl } from "@/lib/tenant";
import { LiveBanner } from "./live-banner";
import { CopyUrl } from "./copy-url";
import { orderRef, StatusBadge } from "../orders/page";

const REVENUE_STATUSES = ["paid", "processing", "shipped", "delivered", "fulfilled"];
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ "just-finished"?: string }>;
}) {
  const tenant = await getCurrentTenant();
  const supabase = await createClient();

  const { since } = statsWindow();

  const [ordersRes, productsRes, txsRes] = await Promise.all([
    supabase
      .from("orders")
      .select("total_minor, status, created_at")
      .eq("tenant_id", tenant?.id),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant?.id)
      .eq("status", "active"),
    supabase
      .from("transactions")
      .select("amount_minor")
      .eq("tenant_id", tenant?.id)
      .eq("status", "success")
      .not("order_id", "is", null),
  ]);

  const allOrders = ordersRes.data ?? [];
  const revenueOrders = allOrders.filter((o) =>
    REVENUE_STATUSES.includes(o.status)
  );
  const recentOrders = allOrders.filter((o) => o.created_at >= since);
  const prevOrders = allOrders.filter(
    (o) => o.created_at < since && o.created_at >= statsWindow().before
  );
  const sumMinor = (list: { total_minor: number }[]) =>
    list.reduce((sum, o) => sum + Number(o.total_minor), 0);

  const totalRevenue = sumMinor(revenueOrders);
  const totalOrders = allOrders.length;
  const recentRevenue = sumMinor(
    revenueOrders.filter((o) => o.created_at >= since)
  );
  const previousRevenue = sumMinor(
    revenueOrders.filter((o) => o.created_at < since && o.created_at >= statsWindow().before)
  );
  const activeProducts = productsRes.count ?? 0;
  const pendingPayouts = (txsRes.data ?? []).reduce(
    (sum, t) => sum + Number(t.amount_minor),
    0
  );

  const { data: latestOrdersRes } = await supabase
    .from("orders")
    .select(
      "id, customer_name, customer_email, total_minor, currency, status, created_at"
    )
    .eq("tenant_id", tenant?.id)
    .order("created_at", { ascending: false })
    .limit(5);
  const latestOrders = latestOrdersRes ?? [];

  const isFreshShop = totalOrders === 0 && activeProducts === 0;
  const salesSeries = buildSalesSeries(revenueOrders, 30);

  const params = await searchParams;
  const justFinished = params["just-finished"] === "1";

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Welcome, {tenant?.name ?? "shop owner"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            Here&apos;s how your shop is doing.
          </p>
        </div>
      </div>

      {justFinished && tenant?.subdomain && (
        <LiveBanner subdomain={tenant.subdomain} />
      )}

      <TenantTheme branding={tenant?.branding} />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Revenue"
          value={formatMoney(totalRevenue, "GHS")}
          delta={pctChange(recentRevenue, previousRevenue)}
          icon={<BanknotesIcon className="h-5 w-5" />}
        />
        <KpiCard
          label="Total Orders"
          value={String(totalOrders)}
          delta={pctChange(recentOrders.length, prevOrders.length)}
          icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        />
        <KpiCard
          label="Active Products"
          value={String(activeProducts)}
          delta={null}
          icon={<CubeIcon className="h-5 w-5" />}
        />
        <KpiCard
          label="Pending Payouts"
          value={formatMoney(pendingPayouts, "GHS")}
          delta={null}
          icon={<WalletIcon className="h-5 w-5" />}
        />
      </div>

      {totalOrders > 0 && (
        <SalesChart series={salesSeries} total={totalRevenue} />
      )}

      {tenant?.subdomain ? (
        <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-heading text-xl font-semibold text-charcoal">
                Your storefront
              </h2>
              <a
                href={getStorefrontUrl(tenant.subdomain)}
                className="mt-2 inline-block text-sm font-medium text-pine underline-offset-4 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {getStorefrontUrl(tenant.subdomain)}
              </a>
              <p className="mt-3 text-sm text-muted">
                Share this link on WhatsApp, Instagram, or your business card.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <CopyUrl url={getStorefrontUrl(tenant.subdomain)} />
              <Link
                href={getStorefrontUrl(tenant.subdomain)}
                target="_blank"
                className="rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
              >
                View shop
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-7">
          <p className="text-sm font-medium text-gold-dark">
            Finish setting up your shop to get your storefront link.
          </p>
        </div>
      )}

      {latestOrders.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <div className="flex items-center justify-between px-6 pt-6">
            <h2 className="font-heading text-xl font-semibold text-charcoal">
              Recent orders
            </h2>
            <Link
              href="/orders"
              className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-charcoal/10 text-left">
              <thead>
                <tr className="bg-cream-soft/60 text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="px-6 py-3">Order</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal/5">
                {latestOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="transition duration-150 hover:bg-cream-soft/40"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-charcoal">
                      <Link
                        href={`/orders/${o.id}`}
                        className="hover:text-pine"
                      >
                        {orderRef(o.id)}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-charcoal">
                      {o.customer_name}
                    </td>
                    <td className="px-6 py-4 font-semibold text-charcoal">
                      {formatMoney(o.total_minor, o.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-muted">
                      {new Date(o.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isFreshShop ? (
        <LaunchChecklist
          hasProducts={activeProducts > 0}
          hasPayments={!!tenant?.paystack_subaccount_code}
          storefrontUrl={
            tenant?.subdomain ? getStorefrontUrl(tenant.subdomain) : null
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          <QuickLink
            title="Products"
            href="/products"
            description="Add your catalogue with category-specific details like size, colour, shade or carat."
          />
          <QuickLink
            title="Orders"
            href="/orders"
            description="View and update orders as they come in from your storefront."
          />
          <QuickLink
            title="Customers"
            href="/customers"
            description="See the people shopping with you and what they&apos;ve ordered."
          />
          <QuickLink
            title="Store Settings"
            href="/settings"
            description="Manage your branding, contact details and plan."
          />
        </div>
      )}
    </div>
  );
}

function statsWindow(): { since: string; before: string } {
  return {
    since: new Date(Date.now() - 30 * DAY_MS).toISOString(),
    before: new Date(Date.now() - 60 * DAY_MS).toISOString(),
  };
}

function buildSalesSeries(
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
      label: date.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
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
      <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl" aria-hidden />
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
          {Math.abs(delta)}% vs last 30 days
        </span>
      )}
    </div>
  );
}

function SalesChart({
  series,
  total,
}: {
  series: { label: string; revenue: number }[];
  total: number;
}) {
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const step = 600 / series.length;

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-gold/[0.08] blur-2xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-heading text-xl font-semibold text-charcoal">
            Sales
          </h2>
          <p className="mt-1 text-sm text-muted">Daily revenue, last 30 days</p>
        </div>
        <p className="font-heading text-2xl font-semibold text-pine">
          {formatMoney(total, "GHS")}
        </p>
      </div>
      <div className="relative mt-6">
        <svg
          viewBox="0 0 600 200"
          className="h-52 w-full"
          role="img"
          aria-label="Bar chart of daily revenue over the last 30 days"
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
            const h = Math.max((s.revenue / max) * 150, s.revenue > 0 ? 3 : 0);
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
    </section>
  );
}

function LaunchChecklist({
  hasProducts,
  hasPayments,
  storefrontUrl,
}: {
  hasProducts: boolean;
  hasPayments: boolean;
  storefrontUrl: string | null;
}) {
  const steps = [
    {
      title: "Add your first product",
      hint: "List one item so customers can start buying.",
      done: hasProducts,
      href: "/products/new",
    },
    {
      title: "Connect payments",
      hint: "Link your bank account so you get paid on every sale.",
      done: hasPayments,
      href: "/settings",
    },
    {
      title: "Share your storefront",
      hint: "Send your shop link to family, friends and customers.",
      done: false,
      href: storefrontUrl ?? "/settings",
    },
  ];
  const doneCount = steps.filter((s) => s.done).length;

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
      />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-heading text-xl font-semibold text-charcoal">
              You&apos;re live — let&apos;s get your first sale
            </h2>
            <p className="mt-1 text-sm text-muted">
              {doneCount} of {steps.length} steps done.
            </p>
          </div>
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-pine/10 text-pine">
            <CheckIcon className="h-6 w-6" />
          </span>
        </div>

        <div className="mt-6 grid gap-3">
          {steps.map((step, i) => (
            <Link
              key={step.title}
              href={step.href}
              className={`group flex items-center gap-4 rounded-xl border p-4 transition duration-200 ${
                step.done
                  ? "border-green-200 bg-green-50/50"
                  : "border-charcoal/10 bg-cream/60 hover:-translate-y-px hover:border-pine/30 hover:shadow-md"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.done
                    ? "bg-green-600 text-white"
                    : "bg-pine text-white"
                }`}
              >
                {step.done ? <CheckIcon className="h-4 w-4" /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-charcoal">
                  {step.title}
                </span>
                <span className="block text-xs text-muted">{step.hint}</span>
              </span>
              <span
                aria-hidden
                className="text-pine opacity-0 transition duration-200 group-hover:opacity-100"
              >
                →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuickLink({
  title,
  href,
  description,
}: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_50px_-24px_rgba(27,67,50,0.45)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
      />
      <h3 className="relative font-heading text-xl font-semibold text-charcoal transition duration-200 group-hover:text-pine">
        {title}
      </h3>
      <p className="relative mt-2 text-sm leading-relaxed text-muted">
        {description}
      </p>
    </Link>
  );
}

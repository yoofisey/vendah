import Link from "next/link";
import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { getTenantBySubdomain } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AccountForm } from "./account-form";

type OrderItem = {
  product_name: string;
  quantity: number;
  price_minor: number;
};

type Order = {
  id: string;
  reference: string | null;
  status: string;
  total_minor: number;
  currency: string;
  created_at: string;
  order_items: OrderItem[];
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  processing: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  delivered: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-600",
};

export default async function AccountPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-center font-heading text-3xl font-semibold text-charcoal">
          My Account
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Sign in or create an account to track your orders.
        </p>
        <div className="mt-8">
          <AccountForm subdomain={subdomain} />
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const { data: orders } = await admin
    .from("orders")
    .select("id, reference, status, total_minor, currency, created_at, order_items(product_name, quantity, price_minor)")
    .eq("tenant_id", tenant.id)
    .eq("customer_email", user.email)
    .order("created_at", { ascending: false });

  const typedOrders = (orders ?? []) as unknown as Order[];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        My Account
      </h1>

      <div className="mt-6 rounded-xl border border-white/70 bg-white p-6 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pine text-lg font-bold text-white">
            {(user.user_metadata?.full_name ?? user.email ?? "?")
              .slice(0, 1)
              .toUpperCase()}
          </span>
          <div>
            <p className="font-medium text-charcoal">
              {user.user_metadata?.full_name ?? "Customer"}
            </p>
            <p className="text-sm text-muted">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-heading text-xl font-semibold text-charcoal">
          Order History
        </h2>
        {typedOrders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-charcoal/20 bg-white p-12 text-center">
            <p className="text-sm text-muted">No orders yet.</p>
            <Link
              href="/shop"
              className="mt-4 inline-block rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {typedOrders.map((order) => (
              <li
                key={order.id}
                className="overflow-hidden rounded-xl border border-white/70 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/5 px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold text-charcoal">
                      {order.reference ?? order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[order.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-charcoal">
                      {formatMoney(order.total_minor, order.currency)}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(order.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="px-5 py-3">
                  <p className="text-xs text-muted">
                    {order.order_items.length} item
                    {order.order_items.length === 1 ? "" : "s"}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {order.order_items.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex justify-between text-sm text-charcoal-soft"
                      >
                        <span>
                          {item.product_name}{" "}
                          <span className="text-muted">× {item.quantity}</span>
                        </span>
                        <span className="font-medium">
                          {formatMoney(
                            item.price_minor * item.quantity,
                            order.currency
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

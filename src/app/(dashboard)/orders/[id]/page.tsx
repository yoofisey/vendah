import { notFound, redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import { createClient } from "@/lib/supabase/server";
import { setOrderStatus } from "../actions";
import { StatusBadge } from "../page";
import { RefundForm } from "./refund-form";
import { ReturnRequests } from "./return-requests";
import { createReturnRequestAction } from "./return-actions";

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "paid",
  paid: "processing",
  processing: "shipped",
  shipped: "delivered",
};

const LABELS: Record<OrderStatus, string> = {
  pending: "Mark paid",
  paid: "Start processing",
  processing: "Mark shipped",
  shipped: "Mark delivered",
  delivered: "Mark delivered",
  cancelled: "Cancel order",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", tenant.id)
    .maybeSingle();
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id)
    .order("id", { ascending: true });

  const { data: returnRequests } = await supabase
    .from("return_requests")
    .select("*")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false });

  const status = order.status as OrderStatus;
  const next = NEXT[status];
  const canCancel = status !== "cancelled" && status !== "delivered";
  const actionStatuses = ORDER_STATUSES.filter(
    (s) => s === next || (s === "cancelled" && canCancel)
  );

  const deliveryFee =
    order.delivery_method === "delivery"
      ? (tenant.delivery_fee_minor as number) ?? 0
      : 0;
  const discountMinor = order.discount_minor ?? 0;
  const taxMinor = order.tax_minor ?? 0;
  const refundMinor = order.refund_minor ?? 0;
  const subtotal = order.total_minor - deliveryFee - taxMinor + discountMinor;

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Order
          </h1>
          <p className="mt-1 text-sm text-muted">
            Placed{" "}
            {new Date(order.created_at).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {order.status_updated_at && (
              <>
                {" "}
                · last updated{" "}
                {new Date(order.status_updated_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </>
            )}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Customer
        </h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Name</dt>
            <dd className="font-medium text-charcoal">{order.customer_name}</dd>
          </div>
          <div>
            <dt className="text-muted">Email</dt>
            <dd className="font-medium text-charcoal">
              {order.customer_email ? (
                <a
                  href={`mailto:${order.customer_email}`}
                  className="text-pine underline-offset-4 hover:underline"
                >
                  {order.customer_email}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Phone</dt>
            <dd className="font-medium text-charcoal">
              {order.customer_phone ? (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="text-pine underline-offset-4 hover:underline"
                >
                  {order.customer_phone}
                </a>
              ) : (
                "—"
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Collection</dt>
            <dd className="font-medium capitalize text-charcoal">
              {order.delivery_method ?? "pickup"}
            </dd>
          </div>
          {order.customer_address && (
            <div className="sm:col-span-2">
              <dt className="text-muted">Address</dt>
              <dd className="font-medium text-charcoal">
                {order.customer_address}
              </dd>
            </div>
          )}
          {order.notes && (
            <div className="sm:col-span-2">
              <dt className="text-muted">Notes</dt>
              <dd className="font-medium text-charcoal">{order.notes}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Items
        </h2>
        <ul className="mt-3 divide-y divide-charcoal/10 text-sm">
          {(items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3.5">
              <div className="min-w-0">
                <p className="font-medium text-charcoal">{item.product_name}</p>
                <p className="text-xs text-muted">× {item.quantity}</p>
              </div>
              <span className="font-medium text-charcoal">
                {formatMoney(item.price_minor * item.quantity, "GHS")}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-charcoal/10 pt-3 space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Subtotal</span>
            <span className="font-medium text-charcoal">
              {formatMoney(subtotal, order.currency)}
            </span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Delivery fee</span>
              <span className="font-medium text-charcoal">
                {formatMoney(deliveryFee, order.currency)}
              </span>
            </div>
          )}
          {discountMinor > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Discount{order.discount_code ? ` (${order.discount_code})` : ""}</span>
              <span className="font-medium text-green-700">
                -{formatMoney(discountMinor, order.currency)}
              </span>
            </div>
          )}
          {taxMinor > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Tax{order.tax_rate_name ? ` (${order.tax_rate_name})` : ""}</span>
              <span className="font-medium text-charcoal">
                {formatMoney(taxMinor, order.currency)}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-charcoal/10 pt-2">
            <span className="text-sm font-medium text-charcoal">Total</span>
            <span className="text-lg font-bold text-pine">
              {formatMoney(order.total_minor, order.currency)}
            </span>
          </div>
          {refundMinor > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium text-red-600">Refunded</span>
              <span className="text-sm font-bold text-red-600">
                -{formatMoney(refundMinor, order.currency)}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Fulfilment
        </h2>
        {actionStatuses.length > 0 ? (
          <>
            <p className="mt-1 text-xs text-muted">
              Moving the order forward notifies the customer by email.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {actionStatuses.map((statusOption) => (
                <form key={statusOption} action={setOrderStatus}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="status" value={statusOption} />
                  <button
                    type="submit"
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                      statusOption === "cancelled"
                        ? "border border-red-200 text-red-600 hover:bg-red-50"
                        : "bg-pine text-white shadow-md shadow-pine/20 hover:bg-pine-dark"
                    }`}
                  >
                    {LABELS[statusOption]}
                  </button>
                </form>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">
            This order is {status === "cancelled" ? "cancelled" : "complete"}.
          </p>
        )}
      </section>

      {status !== "cancelled" && refundMinor < (order.total_minor as number) && (
        <RefundForm
          orderId={order.id}
          maxRefundable={(order.total_minor as number) - refundMinor}
          currency={order.currency}
        />
      )}

      {returnRequests && returnRequests.length > 0 && (
        <ReturnRequests
          requests={returnRequests}
        />
      )}

      {status !== "cancelled" && status !== "delivered" && (
        <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <h2 className="font-heading text-lg font-semibold text-charcoal">
            Request a return
          </h2>
          <p className="mt-1 text-xs text-muted">
            Customers can request a return from their order tracking page. You can also create one on their behalf.
          </p>
          <form action={createReturnRequestAction} className="mt-4 space-y-3">
            <input type="hidden" name="orderId" value={order.id} />
            <textarea
              name="returnReason"
              required
              rows={2}
              placeholder="Reason for return..."
              className="w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
            <button
              type="submit"
              className="rounded-lg border border-charcoal/15 px-4 py-2 text-sm font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
            >
              Create return request
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

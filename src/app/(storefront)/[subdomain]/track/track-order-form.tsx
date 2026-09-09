"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { formatMoney } from "@/lib/format";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import { lookupOrder, type TrackState } from "./actions";
import type { TrackedOrder } from "@/lib/storefront";

const TRACK_STEPS = ["pending", "paid", "processing", "shipped", "delivered"];

const inputClass =
  "mt-1 w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

export function TrackOrderForm({
  tenantId,
  initialRef,
}: {
  tenantId: string;
  initialRef: string | null;
}) {
  const [state, action, pending] = useActionState<TrackState, FormData>(
    lookupOrder,
    {}
  );

  const order = "order" in state ? state.order : null;
  const error = "error" in state ? state.error : undefined;
  const { subdomain } = useParams<{ subdomain?: string }>();

  return (
    <div className="space-y-6">
      <form action={action} className="space-y-4">
        <input type="hidden" name="tenantId" value={tenantId} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="reference" className="block text-sm font-medium">
              Order reference
            </label>
            <input
              id="reference"
              name="reference"
              required
              defaultValue={initialRef ?? ""}
              placeholder="VH-8F3K2QPZ"
              className={`font-mono ${inputClass}`}
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium">
              Phone or email used at checkout
            </label>
            <input
              id="contact"
              name="contact"
              required
              placeholder="0244123456 or you@email.com"
              className={`${inputClass}`}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-pine px-7 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Looking up…" : "Track order"}
        </button>
      </form>

      {order && <OrderStatusCard order={order} subdomain={subdomain} />}
    </div>
  );
}

function OrderStatusCard({
  order,
  subdomain,
}: {
  order: TrackedOrder;
  subdomain?: string;
}) {
  const current = TRACK_STEPS.indexOf(order.status);
  const cancelled = order.status === "cancelled";

  return (
    <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/10 bg-cream px-6 py-4">
        <div>
          <p className="font-mono text-lg font-bold text-charcoal">
            {order.reference}
          </p>
          <p className="text-xs text-muted">
            Placed{" "}
            {new Date(order.created_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}{" "}
            · {order.delivery_method === "delivery" ? "Delivery" : "Pickup"}
          </p>
        </div>
        <p className="text-xl font-bold text-pine">
          {formatMoney(order.total_minor, order.currency)}
        </p>
      </div>

      <div className="px-6 py-6">
        {cancelled ? (
          <div className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
            <p className="font-semibold">This order was cancelled.</p>
            <p className="mt-1">
              If you paid, a refund will be issued to the method you used.
            </p>
          </div>
        ) : (
          <ol className="grid grid-cols-2 gap-y-5 sm:grid-cols-5">
            {TRACK_STEPS.map((step, index) => {
              const done = current >= index;
              const isCurrent = current === index;
              const label = step.charAt(0).toUpperCase() + step.slice(1);
              return (
                <li key={step} className="relative flex items-center gap-2.5">
                  {index > 0 && (
                    <span
                      className={`absolute -left-[calc(50%+10px)] top-[15px] hidden h-0.5 w-[calc(100%-20px)] sm:block ${
                        done && !cancelled ? "bg-pine" : "bg-charcoal/10"
                      }`}
                    />
                  )}
                  <span
                    className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done && !cancelled
                        ? "bg-pine text-white"
                        : isCurrent
                          ? "border-2 border-pine text-pine"
                          : "border border-charcoal/15 bg-white text-muted"
                    }`}
                  >
                    {done && !cancelled ? (
                      <CheckCircleIcon className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      done ? "text-charcoal" : "text-muted"
                    }`}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {order.items.length > 0 && (
        <div className="border-t border-charcoal/10">
          <ul className="divide-y divide-charcoal/5 px-6">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3.5 text-sm">
                <span className="text-charcoal-soft">
                  {item.product_name}{" "}
                  <span className="text-muted">× {item.quantity}</span>
                  {item.attributes &&
                    Object.keys(item.attributes).length > 0 && (
                      <span className="text-xs text-muted">
                        {" "}
                        — {Object.values(item.attributes).join(", ")}
                      </span>
                    )}
                </span>
                <span className="font-semibold text-charcoal">
                  {formatMoney(
                    item.price_minor * item.quantity,
                    order.currency
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {order.notes && (
        <p className="border-t border-charcoal/10 px-6 py-4 text-sm text-muted">
          {order.notes}
        </p>
      )}

      <div className="border-t border-charcoal/10 px-6 py-4 text-sm">
        <Link
          href={resolveStorefrontHref(subdomain, "/shop")}
          className="font-medium text-pine underline-offset-4 hover:underline"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

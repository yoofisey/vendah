import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { ClearCart } from "@/components/cart/clear-cart";
import { formatMoney } from "@/lib/format";
import { finalizePaidOrder } from "@/lib/orders";
import { getTenantBySubdomain } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { subdomain } = await params;
  const { reference, order } = await searchParams;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const ref = typeof reference === "string" ? reference : null;
  const orderRef = typeof order === "string" ? order : null;
  const result = ref ? await finalizePaidOrder(ref) : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const momoPending =
    result !== null &&
    !result.ok &&
    result.reason === "unpaid" &&
    result.channel === "mobile_money";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <ClearCart tenantId={tenant.id} />
      {result?.ok ? (
        <div className="rounded-2xl border border-charcoal/10 bg-white p-10 text-center shadow-lg sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircleIcon className="h-9 w-9 text-emerald-600" />
          </span>
          <h1 className="mt-5 font-heading text-3xl font-semibold text-charcoal">
            Order received
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Thanks, {result.order.customer_name}! {tenant.name} has been
            notified and will confirm your collection or delivery.
          </p>
          <div className="mt-8 rounded-2xl bg-cream p-6 text-left">
            <ul className="divide-y divide-charcoal/10 text-sm">
              {result.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 py-3">
                  <span className="text-charcoal-soft">
                    {item.product_name}{" "}
                    <span className="text-muted">× {item.quantity}</span>
                  </span>
                  <span className="font-semibold text-charcoal">
                    {formatMoney(
                      item.price_minor * item.quantity,
                      result.order.currency as string
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-charcoal/10 pt-4">
              <span className="text-sm text-muted">Total paid</span>
              <span className="text-xl font-bold text-pine">
                {formatMoney(
                  result.order.total_minor as number,
                  result.order.currency as string
                )}
              </span>
            </div>
            {orderRef && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-pine/5 p-4">
                <div>
                  <p className="text-xs text-muted">Order reference</p>
                  <p className="mt-0.5 font-mono text-base font-bold text-charcoal">
                    {orderRef}
                  </p>
                </div>
                <Link
                  href={`/track?ref=${encodeURIComponent(orderRef)}`}
                  className="rounded-lg bg-pine px-4 py-2 text-xs font-semibold text-white transition duration-150 hover:bg-pine-dark"
                >
                  Track order
                </Link>
              </div>
            )}
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/shop"
              className="inline-block rounded-lg bg-pine px-7 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
            >
              Continue shopping
            </Link>
            {!user && (
              <Link
                href="/account"
                className="inline-block rounded-lg border border-charcoal/15 bg-white px-7 py-3 text-sm font-semibold text-charcoal transition duration-150 hover:-translate-y-px hover:shadow-sm"
              >
                Create an account to sync your wishlist across devices
              </Link>
            )}
          </div>
        </div>
      ) : momoPending ? (
        <div className="rounded-2xl border border-charcoal/10 bg-white p-10 text-center shadow-lg sm:p-12">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
            <span className="h-6 w-6 animate-pulse rounded-full bg-gold" />
          </span>
          <h1 className="mt-5 font-heading text-3xl font-semibold text-charcoal">
            Waiting for payment approval
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Your order is on hold until your mobile money network confirms the
            payment. Check the prompt on your phone and approve it — we&apos;ll
            email your confirmation the moment it clears.
          </p>
          {orderRef && (
            <div className="mt-8 rounded-2xl bg-cream p-6">
              <p className="text-xs text-muted">Order reference</p>
              <p className="mt-0.5 font-mono text-base font-bold text-charcoal">
                {orderRef}
              </p>
            </div>
          )}
          <Link
            href={`/track?ref=${encodeURIComponent(orderRef ?? "")}`}
            className="mt-8 inline-block rounded-lg bg-pine px-7 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
          >
            Track order
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-charcoal/10 bg-white p-10 text-center shadow-lg sm:p-12">
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Payment not confirmed
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            We couldn&apos;t confirm a completed payment. If you were charged,
            it will be refunded automatically. Try again if you&apos;d like to
            order.
          </p>
          <Link
            href="/checkout"
            className="mt-8 inline-block rounded-lg bg-pine px-7 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
          >
            Back to checkout
          </Link>
        </div>
      )}
    </div>
  );
}

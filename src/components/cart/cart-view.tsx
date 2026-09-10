"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { cartTotalMinor, writeCart } from "@/lib/cart";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/components/cart/use-cart";
import { CheckoutModal } from "@/components/checkout/checkout-modal";

export function CartView({
  tenantId,
  deliveryFeeMinor,
  shopName,
}: {
  tenantId: string;
  deliveryFeeMinor: number;
  shopName?: string;
}) {
  const items = useCart(tenantId);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  function updateQuantity(productId: string, quantity: number) {
    const next = items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.max(0, quantity) }
        : item
    );
    writeCart(tenantId, next.filter((item) => item.quantity > 0));
  }

  function remove(productId: string) {
    writeCart(
      tenantId,
      items.filter((item) => item.productId !== productId)
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="mt-10 rounded-2xl border border-charcoal/10 bg-white p-14 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-pine/10 text-pine">
            <ShoppingBagIcon className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm text-muted">Your cart is empty.</p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
          >
            Continue shopping
          </Link>
        </div>
        {checkoutOpen && (
          <CheckoutModal
            tenantId={tenantId}
            deliveryFeeMinor={deliveryFeeMinor}
            shopName={shopName}
            onClose={() => setCheckoutOpen(false)}
          />
        )}
      </>
    );
  }

  const total = cartTotalMinor(items);

  return (
    <>
      <div className="mt-8 space-y-5">
        <ul className="divide-y divide-charcoal/5 rounded-2xl border border-charcoal/10 bg-white shadow-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex items-center gap-5 p-5">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl border border-charcoal/10 object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-cream-soft text-base font-semibold text-muted">
                  {item.name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-medium text-charcoal">
                  {item.name}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {formatMoney(item.priceMinor, item.currency)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={`Decrease quantity of ${item.name}`}
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="h-9 w-9 rounded-lg border border-charcoal/15 text-sm text-charcoal-soft transition duration-150 hover:bg-cream"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-medium">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  aria-label={`Increase quantity of ${item.name}`}
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="h-9 w-9 rounded-lg border border-charcoal/15 text-sm text-charcoal-soft transition duration-150 hover:bg-cream"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => remove(item.productId)}
                className="text-sm font-medium text-muted transition duration-150 hover:text-red-500"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between rounded-2xl border border-charcoal/10 bg-white p-5 shadow-sm">
          <span className="text-sm text-muted">Subtotal</span>
          <span className="font-heading text-xl font-semibold text-charcoal">
            {formatMoney(total)}
          </span>
        </div>

        <button
          onClick={() => setCheckoutOpen(true)}
          className="block w-full rounded-lg bg-pine px-6 py-3.5 text-center text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg"
        >
          Proceed to checkout
        </button>

        <Link
          href="/shop"
          className="block w-full rounded-lg border border-charcoal/15 bg-white px-6 py-3.5 text-center text-sm font-medium text-charcoal-soft transition duration-150 hover:bg-cream"
        >
          Continue shopping
        </Link>
      </div>
      {checkoutOpen && (
        <CheckoutModal
          tenantId={tenantId}
          deliveryFeeMinor={deliveryFeeMinor}
          shopName={shopName}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </>
  );
}

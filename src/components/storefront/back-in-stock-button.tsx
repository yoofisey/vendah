"use client";

import { useState, useActionState } from "react";
import { subscribeBackInStockAction } from "@/app/(storefront)/[subdomain]/products/[slug]/actions";

type Props = {
  tenantId: string;
  productId: string;
};

export function BackInStockButton({ tenantId, productId }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(subscribeBackInStockAction, {
    ok: false,
    error: undefined,
    initialized: false,
  });

  if (state.ok && state.initialized) {
    return (
      <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        We&apos;ll let you know!
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-pine/30 bg-white px-5 py-3 text-sm font-semibold text-pine transition duration-150 hover:-translate-y-px hover:shadow-md"
      >
        Notify me when available
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="tenantId" value={tenantId} />
      <input type="hidden" name="productId" value={productId} />
      <input
        name="email"
        type="email"
        required
        placeholder="you@example.com"
        className="rounded-lg border border-charcoal/15 px-3 py-2.5 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      {state.error && state.initialized && (
        <p className="text-xs text-red-600">{state.error}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Subscribing…" : "Notify me"}
      </button>
    </form>
  );
}

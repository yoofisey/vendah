"use client";

import { useState } from "react";
import { readCart, writeCart } from "@/lib/cart";
import { notify } from "@/components/toast";
import type { Product } from "@/lib/types";

export function AddToCart({
  tenantId,
  product,
  variantId,
  variantName,
  className = "",
  disabled = false,
}: {
  tenantId: string;
  product: Product;
  variantId?: string;
  variantName?: string;
  className?: string;
  disabled?: boolean;
}) {
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (disabled) return;
    const items = readCart(tenantId);
    const cartKey = variantId ? `${product.id}:${variantId}` : product.id;
    const existing = items.find((i) => {
      const key = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
      return key === cartKey;
    });
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({
        productId: product.id,
        variantId: variantId ?? undefined,
        slug: product.slug,
        name: variantName ? `${product.name} — ${variantName}` : product.name,
        priceMinor: product.price_minor,
        currency: product.currency,
        image: product.images?.[0] ?? null,
        quantity: 1,
      });
    }
    writeCart(tenantId, items);
    notify({ kind: "cart", title: "Added to cart", description: product.name });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className={`rounded-lg bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {added ? "Added to cart \u2713" : "Add to cart"}
    </button>
  );
}

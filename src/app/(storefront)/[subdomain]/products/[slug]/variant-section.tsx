"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { VariantSelector } from "@/components/storefront/variant-selector";
import { BackInStockButton } from "@/components/storefront/back-in-stock-button";
import { AddToCart } from "./add-to-cart";
import type { Product, ProductVariant } from "@/lib/types";

export function VariantClientSection({
  tenantId,
  product,
  variants,
  soldOut,
}: {
  tenantId: string;
  product: Product;
  variants: ProductVariant[];
  soldOut: boolean;
}) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  if (variants.length === 0) {
    return soldOut ? (
      <BackInStockButton tenantId={tenantId} productId={product.id} />
    ) : (
      <AddToCart tenantId={tenantId} product={product} className="mt-8" />
    );
  }

  const displayPrice = selectedVariant?.price_override_minor ?? product.price_minor;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const isSoldOut = selectedVariant ? displayStock === 0 : false;

  return (
    <div>
      <VariantSelector
        variants={variants}
        basePrice={product.price_minor}
        onVariantChange={setSelectedVariant}
      />
      {selectedVariant && (
        <p className="mt-3 text-2xl font-semibold text-brand">
          {formatMoney(displayPrice, product.currency)}
        </p>
      )}
      {selectedVariant && (
        <p className="mt-2 text-sm text-muted">
          {isSoldOut ? (
            <span className="font-medium text-red-600">Out of stock</span>
          ) : displayStock <= 5 ? (
            <span className="font-medium text-amber-600">
              Low stock — only {displayStock} left
            </span>
          ) : (
            <span className="font-medium text-emerald-600">In stock</span>
          )}
        </p>
      )}
      {isSoldOut ? (
        <BackInStockButton tenantId={tenantId} productId={product.id} />
      ) : (
        <AddToCart
          tenantId={tenantId}
          product={product}
          variantId={selectedVariant?.id}
          variantName={selectedVariant?.name}
          className="mt-8"
        />
      )}
    </div>
  );
}

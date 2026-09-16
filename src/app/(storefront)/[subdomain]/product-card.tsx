"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import { WishlistButton } from "@/components/storefront/wishlist-button";
import { AddToCart } from "./products/[slug]/add-to-cart";
import type { CardStyle } from "@/lib/category-presets";
import type { Product } from "@/lib/types";

const CARD_CLASSES: Record<CardStyle, string> = {
  standard:
    "group flex flex-col overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl",
  editorial:
    "group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl",
  luxe:
    "group flex flex-col overflow-hidden rounded-2xl transition duration-200 hover:-translate-y-1",
  compact:
    "group flex flex-col overflow-hidden rounded-xl border border-charcoal/10 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg",
};

const NAME_CLASSES: Record<CardStyle, string> = {
  standard:
    "line-clamp-2 text-sm font-medium leading-snug text-charcoal transition duration-150 hover:text-pine",
  editorial:
    "line-clamp-2 text-[15px] font-medium leading-snug text-charcoal transition duration-150 hover:text-pine",
  luxe: "line-clamp-2 text-sm font-medium leading-snug text-charcoal transition duration-150 hover:text-pine",
  compact:
    "line-clamp-1 text-xs font-medium leading-snug text-charcoal transition duration-150 hover:text-pine",
};

const PRICE_CLASSES: Record<CardStyle, string> = {
  standard: "text-base font-semibold text-charcoal",
  editorial: "text-base font-semibold text-charcoal",
  luxe: "text-base font-semibold text-gold-dark",
  compact: "text-sm font-semibold text-charcoal",
};

const BUTTON_CLASSES: Record<CardStyle, string> = {
  standard:
    "mt-3 w-full rounded-lg bg-pine py-2.5 text-xs font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
  editorial:
    "mt-3 w-full rounded-lg bg-pine py-2.5 text-xs font-semibold text-white transition duration-200 hover:bg-pine-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50",
  luxe: "mt-3 w-full rounded-lg border border-pine/30 py-2.5 text-xs font-semibold text-pine transition duration-200 hover:bg-pine hover:text-white disabled:cursor-not-allowed disabled:opacity-50",
  compact:
    "mt-2.5 w-full rounded-md bg-pine py-2 text-[11px] font-semibold text-white transition duration-200 hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-50",
};

export function ProductCard({
  product,
  tenantId,
  variant = "standard",
}: {
  product: Product;
  tenantId: string;
  variant?: CardStyle;
}) {
  const image = product.images?.[0];
  const soldOut = product.stock === 0;
  const lowStock = !soldOut && product.stock > 0 && product.stock <= 5;
  const spec = Object.values(product.attributes ?? {})[0];
  const { subdomain } = useParams<{ subdomain?: string }>();
  const productHref = resolveStorefrontHref(
    subdomain,
    `/products/${product.slug}`
  );

  return (
    <div className={CARD_CLASSES[variant]}>
      <Link
        href={productHref}
        className={`relative block w-full bg-cream-soft ${
          variant === "compact" ? "aspect-[1/1]" : "aspect-[4/5]"
        }`}
      >
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-muted">
            No image
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-semibold uppercase tracking-wide text-charcoal">
            Sold out
          </span>
        )}
        {lowStock && (
          <span
            className={`absolute left-2.5 top-2.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 ${
              variant === "compact" ? "px-2 py-0.5 text-[10px]" : ""
            }`}
          >
            Low stock
          </span>
        )}
        <span className="absolute right-2.5 top-2.5">
          <WishlistButton
            tenantId={tenantId}
            productId={product.id}
            productName={product.name}
          />
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Link
          href={productHref}
          className={NAME_CLASSES[variant]}
        >
          {product.name}
        </Link>
        {spec && variant !== "luxe" && (
          <p
            className={`line-clamp-1 text-xs text-muted ${
              variant === "compact" ? "text-[11px]" : ""
            }`}
          >
            {spec}
          </p>
        )}
        <p className={`mt-auto ${PRICE_CLASSES[variant]}`}>
          {formatMoney(product.price_minor, product.currency)}
        </p>
        <AddToCart
          tenantId={tenantId}
          product={product}
          className={BUTTON_CLASSES[variant]}
          disabled={soldOut}
        />
      </div>
    </div>
  );
}

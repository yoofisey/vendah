"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { HeartIcon } from "@heroicons/react/24/outline";
import {
  ensureWishlistSynced,
  getWishlist,
  subscribeWishlist,
} from "@/lib/wishlist";
import { ProductCard } from "../product-card";
import type { Product } from "@/lib/types";

const EMPTY: string[] = [];

export function WishlistGrid({
  products,
  tenantId,
  serverIds,
}: {
  products: Product[];
  tenantId: string;
  serverIds?: string[];
}) {
  const localIds = useSyncExternalStore(
    (cb) => subscribeWishlist(tenantId, cb),
    () => getWishlist(tenantId),
    () => EMPTY
  );
  const ids = serverIds ?? localIds;

  useEffect(() => {
    ensureWishlistSynced(tenantId);
  }, [tenantId]);

  const saved = products.filter((p) => ids.includes(p.id));

  if (saved.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
        <HeartIcon className="mx-auto h-10 w-10 text-charcoal-mute" />
        <p className="mt-4 text-sm font-medium text-charcoal">
          Your wishlist is empty
        </p>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
          Tap the heart on any product to save it here.
        </p>
        {!serverIds && (
          <p className="mt-2 text-xs text-muted">
            <Link
              href="/account"
              className="font-medium text-pine underline-offset-2 hover:underline"
            >
              Sign in
            </Link>{" "}
            to sync your wishlist across devices.
          </p>
        )}
        <Link
          href="/shop"
          className="mt-6 inline-block rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
        >
          Browse products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
      {saved.map((product) => (
        <ProductCard key={product.id} product={product} tenantId={tenantId} />
      ))}
    </div>
  );
}

"use client";

import { useEffect, useSyncExternalStore } from "react";
import { HeartIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon } from "@heroicons/react/24/solid";
import {
  ensureWishlistSynced,
  getWishlist,
  getWishlistCustomerEmail,
  subscribeWishlist,
  toggleWishlistItem,
} from "@/lib/wishlist";
import { toggleWishlistOnServer } from "@/app/(storefront)/[subdomain]/wishlist/actions";

const EMPTY: string[] = [];

export function WishlistButton({
  tenantId,
  productId,
  className = "",
}: {
  tenantId: string;
  productId: string;
  className?: string;
}) {
  const ids = useSyncExternalStore(
    (cb) => subscribeWishlist(tenantId, cb),
    () => getWishlist(tenantId),
    () => EMPTY
  );
  const wishlisted = ids.includes(productId);

  useEffect(() => {
    ensureWishlistSynced(tenantId);
  }, [tenantId]);

  return (
    <button
      type="button"
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={wishlisted}
      onClick={() => {
        toggleWishlistItem(tenantId, productId);
        if (getWishlistCustomerEmail()) {
          toggleWishlistOnServer(tenantId, productId).catch(() => {});
        }
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/10 bg-white/90 shadow-sm backdrop-blur transition duration-200 hover:scale-105 ${
        wishlisted
          ? "text-rose-500"
          : "text-charcoal-mute hover:text-rose-500"
      } ${className}`}
    >
      {wishlisted ? (
        <HeartSolidIcon className="h-5 w-5" />
      ) : (
        <HeartIcon className="h-5 w-5" />
      )}
    </button>
  );
}

"use client";

import Link from "next/link";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import { useCartCount } from "@/components/cart/use-cart";

export function CartLink({ tenantId }: { tenantId: string }) {
  const count = useCartCount(tenantId);

  return (
    <Link
      href="/cart"
      className="relative ml-auto flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-sm font-semibold text-white transition duration-200 hover:bg-white/25 sm:ml-0"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
    >
      <ShoppingBagIcon className="h-5 w-5" />
      <span className="hidden sm:inline">Cart</span>
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-charcoal">
          {count}
        </span>
      )}
    </Link>
  );
}

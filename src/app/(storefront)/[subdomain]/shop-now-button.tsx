"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { resolveStorefrontHref } from "@/lib/storefront-href";

export function ShopNowButton({
  shopName,
  variant = "solid",
}: {
  shopName: string;
  variant?: "solid" | "glass";
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const timers = useRef<number[]>([]);
  const { subdomain } = useParams<{ subdomain?: string }>();
  const shopHref = resolveStorefrontHref(subdomain, "/shop");

  useEffect(() => {
    router.prefetch(shopHref);
    const pending = timers.current;
    return () => pending.forEach((t) => window.clearTimeout(t));
  }, [router, shopHref]);

  const handleClick = () => {
    if (loading) return;
    setLoading(true);
    timers.current.push(window.setTimeout(() => router.push(shopHref), 1100));
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`mt-10 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold shadow-lg transition duration-200 hover:shadow-xl ${
          variant === "glass"
            ? "border border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            : "bg-gold text-charcoal hover:bg-gold-dark hover:text-white"
        }`}
      >
        Shop Now <ChevronDownIcon className="h-4 w-4" />
      </button>

      <div
        aria-hidden={!loading}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brand transition-opacity duration-300 ${
          loading ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-white/20 border-t-gold-light" />
          <div className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-white">
            {shopName.slice(0, 1).toUpperCase()}
          </div>
        </div>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.25em] text-white/75">
          Opening {shopName}
        </p>
        <p className="mt-1 text-xs text-white/45">
          Loading the latest inventory…
        </p>
      </div>
    </>
  );
}

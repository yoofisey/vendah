"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckoutLoading, type CheckoutMethod } from "@/components/checkout/checkout-loading";
import { resolveStorefrontHref } from "@/lib/storefront-href";

const MAX_POLLS = 60;
const POLL_INTERVAL = 5_000;

export function MomoPoll({
  reference,
  orderRef,
  subdomain,
  shopName,
  method = "mtn",
}: {
  reference: string;
  orderRef: string | null;
  subdomain: string;
  shopName?: string;
  method?: CheckoutMethod;
}) {
  const router = useRouter();
  const [count, setCount] = useState(0);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (expired) return;

    const id = setInterval(async () => {
      setCount((prev) => {
        if (prev + 1 >= MAX_POLLS) {
          clearInterval(id);
          setExpired(true);
          return prev + 1;
        }
        return prev + 1;
      });

      try {
        const res = await fetch(
          `/api/checkout/status?ref=${encodeURIComponent(reference)}`
        );
        const data = await res.json();

        if (data.status === "paid") {
          clearInterval(id);
          router.refresh();
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL);

    return () => clearInterval(id);
  }, [reference, router, expired]);

  const progress = Math.min((count / MAX_POLLS) * 100, 100);

  return (
    <CheckoutLoading
      variant="waiting"
      method={method}
      amountMinor={0}
      showAmount={false}
      shopName={shopName}
      subdomain={subdomain}
      methodLabel="Mobile money"
      progress={progress}
      expired={expired}
      footer={
        <div className="flex flex-col items-stretch gap-2.5">
          {expired && (
            <button
              onClick={() => {
                setExpired(false);
                setCount(0);
              }}
              className="w-full rounded-full bg-pine px-6 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark hover:shadow-lg"
            >
              Try again
            </button>
          )}
          {orderRef && (
            <Link
              href={resolveStorefrontHref(
                subdomain,
                `/track?ref=${encodeURIComponent(orderRef)}`
              )}
              className="w-full rounded-full border border-charcoal/15 bg-white px-6 py-3 text-center text-sm font-semibold text-charcoal transition duration-150 hover:-translate-y-px hover:shadow-sm"
            >
              Track order
            </Link>
          )}
        </div>
      }
    />
  );
}
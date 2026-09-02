"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const MAX_POLLS = 60;
const POLL_INTERVAL = 5_000;

export function MomoPoll({
  reference,
  orderRef,
  subdomain,
}: {
  reference: string;
  orderRef: string | null;
  subdomain: string;
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
    <div className="rounded-2xl border border-charcoal/10 bg-white p-10 text-center shadow-lg sm:p-12">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold/20">
        <span className="h-6 w-6 animate-pulse rounded-full bg-gold" />
      </span>
      <h1 className="mt-5 font-heading text-3xl font-semibold text-charcoal">
        {expired ? "Taking longer than expected" : "Waiting for payment approval"}
      </h1>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
        {expired
          ? "We haven&apos;t received confirmation yet. This can take a few minutes with some networks."
          : "Your order is on hold until your mobile money network confirms the payment. Check the prompt on your phone and approve it."}
      </p>
      {!expired && (
        <div className="mx-auto mt-6 max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-charcoal/10">
            <div
              className="h-full rounded-full bg-gold transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted">
            Waiting for mobile money confirmation...
          </p>
        </div>
      )}
      {orderRef && (
        <div className="mt-8 rounded-2xl bg-cream p-6">
          <p className="text-xs text-muted">Order reference</p>
          <p className="mt-0.5 font-mono text-base font-bold text-charcoal">
            {orderRef}
          </p>
        </div>
      )}
      <div className="mt-8 flex flex-col items-center gap-3">
        {expired && (
          <button
            onClick={() => {
              setExpired(false);
              setCount(0);
            }}
            className="inline-block rounded-lg bg-pine px-7 py-3 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
          >
            Retry
          </button>
        )}
        <Link
          href={`/track?ref=${encodeURIComponent(orderRef ?? "")}`}
          className="inline-block rounded-lg border border-charcoal/15 bg-white px-7 py-3 text-sm font-semibold text-charcoal transition duration-150 hover:-translate-y-px hover:shadow-sm"
        >
          Track order
        </Link>
      </div>
    </div>
  );
}

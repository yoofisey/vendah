"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { abandonToFree } from "./actions";

export function PaymentStatus() {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="mx-auto w-full max-w-md px-6 py-16 text-center">
      <span className="mx-auto block h-10 w-10 animate-spin rounded-full border-2 border-charcoal/15 border-t-pine" />
      <h1 className="mt-6 font-heading text-lg font-semibold tracking-tight text-charcoal">
        Confirming your payment…
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Your subscription is being confirmed. This usually takes a few seconds
        and we&apos;ll take you to your dashboard automatically.
      </p>
      <form action={abandonToFree}>
        <button
          type="submit"
          className="mt-8 text-sm font-medium text-muted underline-offset-4 hover:text-charcoal hover:underline"
        >
          Skip for now — use the Free plan
        </button>
      </form>
    </div>
  );
}

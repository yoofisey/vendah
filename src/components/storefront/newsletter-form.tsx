"use client";

import { useActionState } from "react";
import { subscribeNewsletter } from "@/lib/newsletter";

export function NewsletterForm({
  tenantId,
  accentColor,
}: {
  tenantId: string;
  accentColor: string;
}) {
  const [state, action, pending] = useActionState(
    async (_prev: { ok: boolean; error?: string }, formData: FormData) => {
      const email = String(formData.get("email") ?? "");
      return subscribeNewsletter(tenantId, email);
    },
    { ok: false }
  );

  return (
    <div>
      <form action={action} className="mt-6 flex gap-3">
        <input
          type="email"
          name="email"
          required
          placeholder="Your email address"
          className="flex-1 rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: accentColor }}
        >
          {pending ? "..." : "Subscribe"}
        </button>
      </form>
      {state.ok && (
        <p className="mt-3 text-sm font-medium text-pine">
          Thanks for subscribing!
        </p>
      )}
      {state.error && (
        <p className="mt-3 text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}
    </div>
  );
}

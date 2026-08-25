"use client";

import { useState } from "react";
import { resendRecoveryEmail } from "./actions";

export function ResendRecoveryButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false);

  async function handleResend() {
    setPending(true);
    try {
      await resendRecoveryEmail(id);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleResend}
      disabled={pending}
      className="rounded-lg border border-charcoal/10 bg-white px-3 py-1.5 text-xs font-medium text-charcoal-soft transition duration-150 hover:bg-cream hover:shadow-sm disabled:opacity-50"
    >
      {pending ? "Sending..." : "Resend"}
    </button>
  );
}

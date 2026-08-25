"use client";

import { useRef, useState } from "react";
import { processRefundAction } from "./return-actions";

export function RefundForm({
  orderId,
  maxRefundable,
  currency,
}: {
  orderId: string;
  maxRefundable: number;
  currency: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const maxGhs = (maxRefundable / 100).toFixed(2);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const refundAmount = Number(formData.get("refundAmount") ?? 0);
      const reason = String(formData.get("refundReason") ?? "").trim();

      if (refundAmount <= 0) {
        setError("Enter a refund amount greater than zero.");
        return;
      }
      if (!reason) {
        setError("Please provide a reason for the refund.");
        return;
      }
      if (refundAmount > maxRefundable) {
        setError(`Maximum refundable amount is ${currency} ${maxGhs}.`);
        return;
      }

      formData.set("orderId", orderId);
      await processRefundAction(formData);
      setSuccess(true);
    } catch {
      setError("Failed to process refund. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="relative overflow-hidden rounded-xl border border-red-200 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
      <h2 className="font-heading text-lg font-semibold text-charcoal">
        Process refund
      </h2>
      <p className="mt-1 text-xs text-muted">
        Maximum refundable: {currency} {maxGhs}
      </p>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
          Refund processed successfully.
        </p>
      )}

      {!success && (
        <form ref={formRef} action={handleSubmit} className="mt-4 space-y-3">
          <input type="hidden" name="orderId" value={orderId} />
          <div>
            <label
              htmlFor="refundAmount"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Amount (pesewas)
            </label>
            <input
              id="refundAmount"
              name="refundAmount"
              type="number"
              min={1}
              max={maxRefundable}
              required
              placeholder={`Max ${maxRefundable}`}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label
              htmlFor="refundReason"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Reason
            </label>
            <textarea
              id="refundReason"
              name="refundReason"
              required
              rows={2}
              placeholder="Why is this order being refunded?"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition duration-150 hover:bg-red-50 disabled:opacity-50"
          >
            {pending ? "Processing..." : "Refund"}
          </button>
        </form>
      )}
    </section>
  );
}

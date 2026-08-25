"use client";

import { useActionState, useState } from "react";
import { createDiscountCode, type DiscountActionState } from "./actions";

const initialState: DiscountActionState = {};

export function DiscountCodeForm() {
  const [state, action, pending] = useActionState(createDiscountCode, initialState);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90"
      >
        New discount code
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                New discount code
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-charcoal">
                &times;
              </button>
            </div>
            {state.success ? (
              <div className="mt-6 rounded-lg bg-pine/10 p-4 text-sm text-pine">
                Discount code created successfully.
                <button
                  onClick={() => { setOpen(false); window.location.reload(); }}
                  className="ml-3 underline hover:no-underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <form action={action} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="code" className="block text-sm font-medium text-charcoal-soft">
                    Code
                  </label>
                  <input
                    id="code"
                    name="code"
                    required
                    maxLength={40}
                    placeholder="e.g. SUMMER20"
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm uppercase text-charcoal placeholder:normal-case focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="discountType" className="block text-sm font-medium text-charcoal-soft">
                      Type
                    </label>
                    <select
                      id="discountType"
                      name="discountType"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    >
                      <option value="percent">Percentage (%)</option>
                      <option value="fixed">Fixed amount (GH₵)</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="value" className="block text-sm font-medium text-charcoal-soft">
                      Value
                    </label>
                    <input
                      id="value"
                      name="value"
                      type="number"
                      min={1}
                      required
                      placeholder="e.g. 10"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="minOrderMinor" className="block text-sm font-medium text-charcoal-soft">
                      Min. order (GH₵)
                    </label>
                    <input
                      id="minOrderMinor"
                      name="minOrderMinor"
                      type="number"
                      min={0}
                      step={0.01}
                      defaultValue={0}
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="maxUses" className="block text-sm font-medium text-charcoal-soft">
                      Max uses
                    </label>
                    <input
                      id="maxUses"
                      name="maxUses"
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startsAt" className="block text-sm font-medium text-charcoal-soft">
                      Starts at
                    </label>
                    <input
                      id="startsAt"
                      name="startsAt"
                      type="datetime-local"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="expiresAt" className="block text-sm font-medium text-charcoal-soft">
                      Expires at
                    </label>
                    <input
                      id="expiresAt"
                      name="expiresAt"
                      type="datetime-local"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                </div>
                {state.error && (
                  <p className="text-sm text-red-600" role="alert">{state.error}</p>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending ? "Creating…" : "Create code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

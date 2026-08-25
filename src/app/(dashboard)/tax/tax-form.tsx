"use client";

import { useActionState, useState } from "react";
import { createTaxRate, type TaxActionState } from "./actions";

const initialState: TaxActionState = {};

export function TaxRateForm() {
  const [state, action, pending] = useActionState(createTaxRate, initialState);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90"
      >
        New tax rate
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                New tax rate
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-charcoal">
                &times;
              </button>
            </div>
            {state.success ? (
              <div className="mt-6 rounded-lg bg-pine/10 p-4 text-sm text-pine">
                Tax rate created successfully.
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
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal-soft">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    maxLength={100}
                    placeholder="e.g. VAT, Sales Tax"
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ratePct" className="block text-sm font-medium text-charcoal-soft">
                      Rate (%)
                    </label>
                    <input
                      id="ratePct"
                      name="ratePct"
                      type="number"
                      min={0}
                      max={100}
                      step={0.01}
                      required
                      placeholder="e.g. 15"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    />
                  </div>
                  <div>
                    <label htmlFor="appliesTo" className="block text-sm font-medium text-charcoal-soft">
                      Applies to
                    </label>
                    <select
                      id="appliesTo"
                      name="appliesTo"
                      defaultValue="all"
                      className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                    >
                      <option value="all">All products</option>
                      <option value="physical">Physical products</option>
                      <option value="digital">Digital products</option>
                    </select>
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
                    {pending ? "Creating…" : "Create tax rate"}
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

"use client";

import { useActionState, useState } from "react";
import { createGiftCard, type GiftCardActionState } from "./actions";

const initialState: GiftCardActionState = {};

export function GiftCardForm() {
  const [open, setOpen] = useState(false);
  const [nonce, setNonce] = useState(0);

  function openFresh() {
    setNonce((n) => n + 1);
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={openFresh}
        className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90"
      >
        Issue gift card
      </button>

      {open && (
        <GiftCardModal
          key={nonce}
          onClose={() => setOpen(false)}
          onAddAnother={openFresh}
        />
      )}
    </>
  );
}

function GiftCardModal({
  onClose,
  onAddAnother,
}: {
  onClose: () => void;
  onAddAnother: () => void;
}) {
  const [state, action, pending] = useActionState(
    createGiftCard,
    initialState
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-charcoal">
            Issue gift card
          </h2>
          <button onClick={onClose} className="text-muted hover:text-charcoal">
            &times;
          </button>
        </div>

        {state.success ? (
          <div className="mt-6 rounded-lg bg-pine/10 p-4 text-sm text-pine">
            <p>Gift card issued successfully.</p>
            <p className="mt-2">
              Share this code with your customer:
            </p>
            <div className="mt-3 rounded-lg border border-charcoal/10 bg-white px-4 py-3 text-center font-mono text-lg font-bold tracking-widest text-pine">
              {state.code}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={onAddAnother}
                className="rounded-lg bg-pine px-4 py-2 text-xs font-semibold text-white transition hover:bg-pine-dark"
              >
                Issue another
              </button>
              <button
                onClick={onClose}
                className="rounded-lg border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal-soft transition hover:bg-cream"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form action={action} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="valueMinor"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Value (GH₵)
              </label>
              <input
                id="valueMinor"
                name="valueMinor"
                type="number"
                min={1}
                step="0.01"
                required
                placeholder="e.g. 50"
                className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startsAt"
                  className="block text-sm font-medium text-charcoal-soft"
                >
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
                <label
                  htmlFor="expiresAt"
                  className="block text-sm font-medium text-charcoal-soft"
                >
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
              <p className="text-sm text-red-600" role="alert">
                {state.error}
              </p>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending ? "Issuing…" : "Issue gift card"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
"use client";

import { useActionState, useState } from "react";
import { createZone, updateZone, type ZoneActionState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

const initialState: ZoneActionState = {};

export function ZoneForm({
  edit,
  onClose,
}: {
  edit?: {
    id: string;
    name: string;
    feeMinor: number;
    freeAboveMinor: number | null;
    sortOrder: number;
  };
  onClose?: () => void;
} = {}) {
  const [state, action, pending] = useActionState(
    edit ? updateZone : createZone,
    initialState
  );
  const [open, setOpen] = useState(false);

  function handleClose() {
    setOpen(false);
    onClose?.();
  }

  return (
    <>
      {!edit && (
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90"
        >
          Add zone
        </button>
      )}

      {(open || edit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                {edit ? "Edit shipping zone" : "New shipping zone"}
              </h2>
              <button
                onClick={handleClose}
                className="text-muted hover:text-charcoal"
              >
                &times;
              </button>
            </div>

            {state.success ? (
              <div className="mt-6 rounded-lg bg-pine/10 p-4 text-sm text-pine">
                {edit ? "Zone updated successfully." : "Zone created successfully."}
                <button
                  onClick={handleClose}
                  className="ml-3 underline hover:no-underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <form action={action} className="mt-5 space-y-4">
                {edit && <input type="hidden" name="id" value={edit.id} />}

                <div>
                  <label
                    htmlFor="zone-name"
                    className="block text-sm font-medium text-charcoal-soft"
                  >
                    Zone name
                  </label>
                  <input
                    id="zone-name"
                    name="name"
                    required
                    maxLength={80}
                    defaultValue={edit?.name ?? ""}
                    placeholder="e.g. Accra, Tema"
                    className={`mt-1 ${inputClass}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="zone-fee"
                      className="block text-sm font-medium text-charcoal-soft"
                    >
                      Fee (GH₵)
                    </label>
                    <input
                      id="zone-fee"
                      name="feeGhs"
                      type="number"
                      min={0}
                      step={0.5}
                      required
                      defaultValue={edit ? edit.feeMinor / 100 : 0}
                      className={`mt-1 ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="zone-free-above"
                      className="block text-sm font-medium text-charcoal-soft"
                    >
                      Free above (GH₵)
                    </label>
                    <input
                      id="zone-free-above"
                      name="freeAboveGhs"
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="Never"
                      defaultValue={
                        edit?.freeAboveMinor ? edit.freeAboveMinor / 100 : ""
                      }
                      className={`mt-1 ${inputClass}`}
                    />
                    <p className="mt-1 text-xs text-muted">
                      Leave empty for no free-shipping threshold.
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="zone-sort"
                    className="block text-sm font-medium text-charcoal-soft"
                  >
                    Sort order
                  </label>
                  <input
                    id="zone-sort"
                    name="sortOrder"
                    type="number"
                    min={0}
                    defaultValue={edit?.sortOrder ?? 0}
                    className={`mt-1 ${inputClass}`}
                  />
                  <p className="mt-1 text-xs text-muted">
                    Lower numbers appear first.
                  </p>
                </div>

                {state.error && (
                  <p className="text-sm text-red-600" role="alert">
                    {state.error}
                  </p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm font-medium text-charcoal-soft hover:bg-cream"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {pending
                      ? edit
                        ? "Saving…"
                        : "Creating…"
                      : edit
                        ? "Save changes"
                        : "Create zone"}
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

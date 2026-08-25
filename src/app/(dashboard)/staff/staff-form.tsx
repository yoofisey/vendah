"use client";

import { useActionState, useState } from "react";
import { inviteStaff, type StaffActionState } from "./actions";

const initialState: StaffActionState = {};

export function StaffInviteForm() {
  const [state, action, pending] = useActionState(inviteStaff, initialState);
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition duration-150 hover:opacity-90"
      >
        Invite staff
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-charcoal">
                Invite staff member
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-charcoal">
                &times;
              </button>
            </div>
            {state.success ? (
              <div className="mt-6 rounded-lg bg-pine/10 p-4 text-sm text-pine">
                Staff member invited successfully.
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
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal-soft">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="colleague@example.com"
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-charcoal-soft">
                    Role
                  </label>
                  <select
                    id="role"
                    name="role"
                    defaultValue="staff"
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-4 py-2.5 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
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
                    {pending ? "Inviting…" : "Send invite"}
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

"use client";

import { useEffect, useRef } from "react";
import { useActionState } from "react";
import { changePassword } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-charcoal/15 bg-cream px-4 py-2.5 text-sm text-charcoal transition duration-200 placeholder:text-muted focus:border-gold focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/30";

export function SecurityForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={`${inputClass}`}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium">
            New password
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`${inputClass}`}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className={`${inputClass}`}
          />
        </div>
      </div>
      {state.success && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5 text-sm text-green-800">
          Password updated.
        </p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-100 bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-pine px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-200 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

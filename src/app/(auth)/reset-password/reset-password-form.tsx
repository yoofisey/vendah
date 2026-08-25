"use client";

import { useActionState } from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { resetPassword, type ResetState } from "../actions";
import { Field } from "@/components/auth/field";
import { useState } from "react";

const initialState: ResetState = {};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, initialState);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError =
    emailTouched && email.length > 0 && !EMAIL_RE.test(email)
      ? "That doesn't look like a valid email address."
      : null;
  const emailValid = email.length > 0 && EMAIL_RE.test(email);

  if (state.sent) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-6 text-center">
        <CheckCircleIcon className="mx-auto h-10 w-10 text-green-500" />
        <p className="mt-3 text-sm font-semibold text-green-800">
          Check your inbox
        </p>
        <p className="mt-1 text-sm text-green-700">
          We&apos;ve sent a password reset link to{" "}
          <span className="font-medium">{email}</span>.
        </p>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      <Field
        id="email"
        name="email"
        type="email"
        label="Email address"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        onBlur={() => setEmailTouched(true)}
        error={emailError}
        valid={emailValid}
        required
      />

      {state.error && (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          role="alert"
        >
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <span>{state.error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-pine py-3.5 text-sm font-semibold text-white shadow-lg shadow-pine/20 transition duration-200 hover:bg-pine-dark hover:shadow-xl hover:shadow-pine/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-pine/40 active:translate-y-px disabled:cursor-not-allowed disabled:bg-pine/50 disabled:shadow-none"
      >
        {pending ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Sending link…
          </>
        ) : (
          "Send reset link"
        )}
      </button>
    </form>
  );
}

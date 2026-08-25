"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { updatePassword, type UpdatePasswordState } from "../actions";
import { Field } from "@/components/auth/field";

const initialState: UpdatePasswordState = {};

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenReady, setTokenReady] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token")) {
      queueMicrotask(() => setTokenReady(true));
      return;
    }

    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken && refreshToken) {
      const supabase = createClient();
      supabase.auth
        .setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        .then(({ error }) => {
          if (error) {
            setTokenError(
              "Invalid or expired reset link. Please request a new one."
            );
          } else {
            setTokenReady(true);
            window.history.replaceState(
              {},
              "",
              window.location.pathname + window.location.search
            );
          }
        });
    } else {
      queueMicrotask(() =>
        setTokenError("Invalid or expired reset link. Please request a new one.")
      );
    }
  }, []);

  const passwordError =
    passwordTouched && password.length > 0 && password.length < 8
      ? "Password must be at least 8 characters."
      : null;
  const passwordValid = password.length >= 8;

  const confirmError =
    confirmTouched && confirm.length > 0 && confirm !== password
      ? "Passwords don't match."
      : null;
  const confirmValid = confirm.length > 0 && confirm === password;

  if (tokenError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-6 text-center">
        <ExclamationTriangleIcon className="mx-auto h-10 w-10 text-red-500" />
        <p className="mt-3 text-sm font-semibold text-red-800">{tokenError}</p>
        <Link
          href="/reset-password"
          className="mt-4 inline-block rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (!tokenReady) {
    return (
      <div className="flex items-center justify-center py-10">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-pine/30 border-t-pine" />
      </div>
    );
  }

  if (state.done) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-6 text-center">
        <CheckCircleIcon className="mx-auto h-10 w-10 text-green-500" />
        <p className="mt-3 text-sm font-semibold text-green-800">
          Password updated
        </p>
        <p className="mt-1 text-sm text-green-700">
          You can now sign in with your new password.
        </p>
        <Link
          href="/sign-in"
          className="mt-4 inline-block rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action} noValidate className="space-y-5">
      <Field
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        label="New password"
        placeholder="At least 8 characters"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        onBlur={() => setPasswordTouched(true)}
        error={passwordError}
        valid={passwordValid}
        trailing={
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="rounded p-1 text-muted transition duration-200 hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        }
        required
      />

      <Field
        id="confirm"
        name="confirm"
        type={showConfirm ? "text" : "password"}
        label="Confirm password"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        onBlur={() => setConfirmTouched(true)}
        error={confirmError}
        valid={confirmValid}
        trailing={
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            aria-label={showConfirm ? "Hide password" : "Show password"}
            className="rounded p-1 text-muted transition duration-200 hover:text-charcoal focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            {showConfirm ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        }
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
            Updating…
          </>
        ) : (
          "Update password"
        )}
      </button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { logIn, type AuthState } from "../actions";
import { Field } from "@/components/auth/field";
import { createClient } from "@/lib/supabase/client";
import { useAuthTransition } from "@/components/auth-transition-splash";

const initialState: AuthState = {};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function signInWithGoogle(): Promise<{ error?: string } | undefined> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
}

async function signInWithFacebook(): Promise<{ error?: string } | undefined> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "facebook",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) return { error: error.message };
}

export function SignInForm() {
  const [state, action, pending] = useActionState(logIn, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const { begin, end } = useAuthTransition();

  useEffect(() => {
    if (state.error) end();
  }, [state.error, end]);

  const handleGoogle = useCallback(async () => {
    setOauthError(null);
    const res = await signInWithGoogle();
    if (res?.error) setOauthError(res.error);
  }, []);

  const handleFacebook = useCallback(async () => {
    setOauthError(null);
    const res = await signInWithFacebook();
    if (res?.error) setOauthError(res.error);
  }, []);

  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError =
    emailTouched && email.length > 0 && !EMAIL_RE.test(email)
      ? "That doesn't look like a valid email address."
      : null;
  const emailValid = email.length > 0 && EMAIL_RE.test(email);

  return (
    <form
      action={action}
      noValidate
      className="space-y-6"
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        const emailOk = EMAIL_RE.test(String(data.get("email") ?? ""));
        const passwordOk = String(data.get("password") ?? "").length > 0;
        if (emailOk && passwordOk) begin("Signing you in…");
      }}
    >
      <div className="space-y-5">
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

      <Field
        id="password"
        name="password"
        type={showPassword ? "text" : "password"}
        label="Password"
        placeholder="Enter your password"
        autoComplete="current-password"
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
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <label className="flex cursor-pointer items-center gap-2 text-charcoal-soft">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 rounded border-charcoal/20 accent-pine"
          />
          Remember me
        </label>
        <Link
          href="/reset-password"
          className="font-medium text-gold-dark underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>

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
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRightIcon className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </>
        )}
      </button>

      <div className="flex items-center gap-4 pt-1">
        <span className="h-px flex-1 bg-charcoal/10" />
        <span className="text-xs font-medium uppercase tracking-wide text-muted">
          or continue with
        </span>
        <span className="h-px flex-1 bg-charcoal/10" />
      </div>

      {oauthError && (
        <div
          className="flex items-start gap-2.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-sm text-red-700"
          role="alert"
        >
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <span>{oauthError}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 pt-0.5">
        <button
          type="button"
          onClick={handleGoogle}
          className="flex items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white py-3 text-sm font-medium text-charcoal transition duration-200 hover:-translate-y-px hover:border-charcoal/25 hover:shadow-md"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21.35 11.1H12v3.95h5.4a5 5 0 01-2.17 3.2v2.66h3.5c2.05-1.89 3.22-4.67 3.22-7.96 0-.64-.06-1.28-.17-1.9z" fill="#4285F4" />
            <path d="M12 22c2.9 0 5.34-.96 7.12-2.6l-3.5-2.66c-.97.65-2.21 1.03-3.62 1.03-2.78 0-5.13-1.88-5.97-4.4H2.38v2.75A10 10 0 0012 22z" fill="#34A853" />
            <path d="M6.03 13.37a6 6 0 010-2.74V7.88H2.38a10 10 0 000 8.24z" fill="#FBBC05" />
            <path d="M12 5.53c1.58 0 3 .55 4.11 1.62l3.08-3.08A10 10 0 002.38 7.88l3.65 2.75C6.87 7.4 9.22 5.53 12 5.53z" fill="#EA4335" />
          </svg>
          Google
        </button>
        <button
          type="button"
          onClick={handleFacebook}
          className="flex items-center justify-center gap-2 rounded-xl border border-charcoal/15 bg-white py-3 text-sm font-medium text-charcoal transition duration-200 hover:-translate-y-px hover:border-charcoal/25 hover:shadow-md"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="#1877F2">
            <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.09 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.09 24 18.1 24 12.07z" />
          </svg>
          Facebook
        </button>
      </div>
    </form>
  );
}

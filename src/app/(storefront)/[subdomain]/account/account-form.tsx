"use client";

import { useState, useActionState } from "react";
import { customerSignUp, customerSignIn } from "./actions";

type AuthState = {
  error?: string;
  needEmailConfirmation?: boolean;
};

export function AccountForm({ subdomain }: { subdomain: string }) {
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [signUpState, signUpAction, signUpPending] = useActionState(
    async (_prev: AuthState, formData: FormData): Promise<AuthState> => {
      formData.set("subdomain", subdomain);
      return customerSignUp(_prev, formData);
    },
    {}
  );
  const [signInState, signInAction, signInPending] = useActionState(
    async (_prev: AuthState, formData: FormData): Promise<AuthState> => {
      return customerSignIn(_prev, formData);
    },
    {}
  );

  const state = tab === "signin" ? signInState : signUpState;
  const pending = tab === "signin" ? signInPending : signUpPending;
  const action = tab === "signin" ? signInAction : signUpAction;

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-2xl border border-charcoal/10 bg-white shadow-lg">
        <div className="flex border-b border-charcoal/10">
          <button
            type="button"
            onClick={() => setTab("signin")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition duration-150 ${
              tab === "signin"
                ? "border-b-2 border-pine text-pine"
                : "text-muted hover:text-charcoal"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`flex-1 px-4 py-3 text-sm font-semibold transition duration-150 ${
              tab === "signup"
                ? "border-b-2 border-pine text-pine"
                : "text-muted hover:text-charcoal"
            }`}
          >
            Create account
          </button>
        </div>

        <form action={action} className="p-6">
          {tab === "signup" && (
            <div className="mb-4">
              <label
                htmlFor="cust-name"
                className="block text-sm font-medium text-charcoal-soft"
              >
                Name
              </label>
              <input
                id="cust-name"
                name="name"
                required
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
            </div>
          )}

          <div className="mb-4">
            <label
              htmlFor="cust-email"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Email
            </label>
            <input
              id="cust-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="cust-password"
              className="block text-sm font-medium text-charcoal-soft"
            >
              Password
            </label>
            <input
              id="cust-password"
              name="password"
              type="password"
              required
              minLength={6}
              placeholder={tab === "signup" ? "Min. 6 characters" : "Password"}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {state.needEmailConfirmation && (
            <p className="mb-4 text-sm text-pine">
              Check your email to confirm your account, then sign in.
            </p>
          )}

          {state.error && (
            <p className="mb-4 text-sm text-red-600" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-pine px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending
              ? "Please wait…"
              : tab === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}

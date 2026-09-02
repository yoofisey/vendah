"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { SignInForm } from "@/app/(auth)/sign-in/sign-in-form";
import { SignUpForm } from "@/app/(auth)/sign-up/sign-up-form";
import { VendahLogo } from "@/components/vendah-logo";
import type { BusinessCategory } from "@/lib/types";
import {
  AUTH_OPEN_EVENT,
  AUTH_SWITCH_EVENT,
  type AuthMode,
} from "@/components/auth-trigger";

function getModeDetail(detail: unknown): AuthMode {
  return detail === "signup" ? "signup" : "signin";
}

export function AuthSheet({
  categories,
}: {
  categories: BusinessCategory[];
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<AuthMode>("signin");
  const [justSwitched, setJustSwitched] = useState(false);

  const open = useCallback((nextMode: AuthMode) => {
    setMode(nextMode);
    setMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    // wait for slide-down animation then unmount
    setTimeout(() => setMounted(false), 450);
  }, []);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      open(getModeDetail(detail));
    };
    const onSwitch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const next = getModeDetail(detail);
      if (next !== mode) {
        setMode(next);
        setJustSwitched(true);
      }
    };
    window.addEventListener(AUTH_OPEN_EVENT, onOpen);
    window.addEventListener(AUTH_SWITCH_EVENT, onSwitch);
    return () => {
      window.removeEventListener(AUTH_OPEN_EVENT, onOpen);
      window.removeEventListener(AUTH_SWITCH_EVENT, onSwitch);
    };
  }, [open, mode]);

  useEffect(() => {
    if (!justSwitched) return;
    const t = setTimeout(() => setJustSwitched(false), 400);
    return () => clearTimeout(t);
  }, [justSwitched]);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mounted, close]);

  if (!mounted) return null;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setJustSwitched(true);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      <div
        onClick={close}
        className={`absolute inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={mode === "signin" ? "Sign in" : "Open your shop"}
        className={`relative flex max-h-[94vh] w-full max-w-2xl flex-col rounded-t-3xl bg-cream shadow-[0_-24px_60px_-20px_rgba(27,67,50,0.5)] transition-transform duration-400 ease-out sm:mx-4 sm:mb-4 sm:rounded-3xl ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-charcoal/15 sm:hidden" />

        <div className="flex items-center justify-between border-b border-charcoal/10 px-5 py-4 sm:px-8">
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal-soft transition duration-200 hover:border-charcoal/30 hover:text-charcoal"
            aria-label="Back"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <VendahLogo />
          <button
            type="button"
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-charcoal/15 bg-white text-charcoal-soft transition duration-200 hover:border-charcoal/30 hover:text-charcoal"
            aria-label="Close"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          <div
            key={mode}
            className={`transition-all duration-300 ${
              justSwitched ? "animate-step-in" : ""
            }`}
          >
            {mode === "signin" ? (
              <div className="mx-auto max-w-md">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-dark">
                  Retailer access
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-charcoal">
                  Sign in
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Manage products, orders and payouts from one place.
                </p>
                <div className="mt-6">
                  <SignInForm />
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-dark">
                  Start selling today
                </p>
                <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-charcoal sm:text-3xl">
                  Open your shop
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Set up your account, storefront, and category in three simple
                  steps.
                </p>
                <div className="mt-6">
                  <SignUpForm categories={categories} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-charcoal/10 bg-white/60 px-5 py-4 text-center sm:px-8">
          {mode === "signin" ? (
            <p className="text-sm text-muted">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-semibold text-pine underline-offset-4 hover:underline"
              >
                Open your shop →
              </button>
            </p>
          ) : (
            <p className="text-sm text-muted">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className="font-semibold text-pine underline-offset-4 hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";

let active = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeCheckoutTransition(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getCheckoutTransition(): boolean {
  return active;
}

export function startCheckoutTransition() {
  active = true;
  emit();
}

function stopCheckoutTransition() {
  if (!active) return;
  active = false;
  emit();
}

const STATUSES = [
  "Preparing your checkout…",
  "Packing your bag…",
  "Almost there…",
];

export function CheckoutTransitionOverlay() {
  const shown = useSyncExternalStore(
    subscribeCheckoutTransition,
    getCheckoutTransition,
    getCheckoutTransition
  );
  const pathname = usePathname();
  const originRef = useRef<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (shown) {
      if (originRef.current === null && pathname) originRef.current = pathname;
      const id = window.setInterval(() => setIndex((i) => i + 1), 1600);
      return () => window.clearInterval(id);
    }
    originRef.current = null;
  }, [shown, pathname]);

  useEffect(() => {
    if (!shown) return;
    if (pathname && /\/checkout$/.test(pathname)) {
      stopCheckoutTransition();
      return;
    }
    if (originRef.current && pathname && pathname !== originRef.current) {
      stopCheckoutTransition();
      return;
    }
    const timer = window.setTimeout(stopCheckoutTransition, 8000);
    return () => window.clearTimeout(timer);
  }, [shown, pathname]);

  if (!shown) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        className="animate-fade-in absolute inset-0 bg-charcoal/45 backdrop-blur-md"
      />
      <div className="animate-sheet-in card-elevate relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-8 text-center shadow-2xl backdrop-blur-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-[2rem] bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(212,160,23,0.16),transparent_60%)]"
        />

        <div className="relative flex items-center justify-center">
          <span className="relative flex h-28 w-28 items-center justify-center">
            <span className="animate-processing-ring absolute inset-0">
              <svg viewBox="0 0 100 100" className="h-full w-full">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  pathLength={100}
                  fill="none"
                  strokeWidth={7}
                  className="stroke-charcoal/10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  pathLength={100}
                  fill="none"
                  strokeWidth={7}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  strokeDasharray="26 74"
                  style={{ stroke: "var(--brand-accent, #d4a017)" }}
                />
              </svg>
            </span>
            <span
              className="relative"
              style={{ color: "var(--brand-primary, #1b4332)" }}
            >
              <ShoppingBagIcon className="h-8 w-8" />
            </span>
          </span>
        </div>

        <p className="relative mt-6 font-heading text-2xl font-semibold tracking-tight text-charcoal">
          Preparing your checkout
        </p>
        <p
          key={index}
          className="animate-status-in relative mt-2 text-sm text-muted"
        >
          {STATUSES[index % STATUSES.length]}
        </p>

        <p className="relative mt-7 inline-flex items-center gap-1.5 border-t border-charcoal/10 pt-4 text-xs text-muted">
          Powered by
          <span className="font-heading text-sm font-semibold tracking-tight text-charcoal">
            venfii<span className="text-gold">.</span>
          </span>
        </p>
      </div>
    </div>
  );
}
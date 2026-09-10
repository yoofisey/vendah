"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CreditCardIcon,
  DevicePhoneMobileIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { formatMoney } from "@/lib/format";

export type CheckoutMethod =
  | "mtn"
  | "vodafone"
  | "airteltigo"
  | "card"
  | "cod";

const METHOD_LABEL: Record<CheckoutMethod, string> = {
  mtn: "MTN Mobile Money",
  vodafone: "Vodafone Cash",
  airteltigo: "AirtelTigo Money",
  card: "Card",
  cod: "Cash on delivery",
};

type StatusKind = "momo" | "card" | "cod";

const STATUS: Record<StatusKind, string[]> = {
  momo: [
    "Creating your order…",
    "Contacting your mobile money network…",
    "Waiting for approval on your phone…",
  ],
  card: [
    "Securing your payment…",
    "Contacting the payment gateway…",
    "Confirming your order…",
  ],
  cod: [
    "Creating your order…",
    "Confirming delivery details…",
    "Locking in your order…",
  ],
};

const METHOD_ICON: Record<CheckoutMethod, ReactNode> = {
  mtn: <DevicePhoneMobileIcon className="h-8 w-8" />,
  vodafone: <DevicePhoneMobileIcon className="h-8 w-8" />,
  airteltigo: <DevicePhoneMobileIcon className="h-8 w-8" />,
  card: <CreditCardIcon className="h-8 w-8" />,
  cod: <ShoppingBagIcon className="h-8 w-8" />,
};

function methodKind(method: CheckoutMethod): StatusKind {
  return method === "card" ? "card" : method === "cod" ? "cod" : "momo";
}

function prettySubdomain(subdomain?: string): string | null {
  if (!subdomain) return null;
  return subdomain
    .split(/[-_]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function CheckoutLoading({
  variant,
  method,
  amountMinor,
  currency = "GHS",
  shopName,
  subdomain,
  methodLabel,
  progress,
  expired = false,
  footer,
  showAmount = true,
}: {
  variant: "overlay" | "waiting";
  method: CheckoutMethod;
  amountMinor: number;
  currency?: string;
  shopName?: string;
  subdomain?: string;
  methodLabel?: string;
  progress?: number;
  expired?: boolean;
  footer?: ReactNode;
  showAmount?: boolean;
}) {
  const kind = methodKind(method);
  const statuses = STATUS[kind];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (variant === "waiting" || expired) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % statuses.length),
      2600
    );
    return () => clearInterval(id);
  }, [variant, expired, statuses.length]);

  const label = shopName ?? prettySubdomain(subdomain) ?? "This shop";
  const statusText = expired
    ? "Taking longer than expected…"
    : variant === "waiting"
      ? "Waiting for payment approval"
      : statuses[index];
  const statusHint = expired
    ? "This can take a few minutes with some networks. We'll keep watching for confirmation."
    : variant === "waiting"
      ? "Approve the payment prompt on your phone — your order is on hold until your network confirms the payment."
      : kind === "cod"
        ? "No online payment needed — pay in cash when your order arrives."
        : "Payments are processed securely by Paystack.";

  const ring = expired ? "absolute inset-0" : "animate-processing-ring absolute inset-0";

  const card = (
    <div className="card-elevate relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/60 bg-white/85 p-7 text-center shadow-2xl backdrop-blur-2xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-40 rounded-t-[2rem] bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(212,160,23,0.16),transparent_60%)]"
      />

      <header className="relative flex items-center justify-center gap-3">
        <span
          style={{ backgroundColor: "var(--brand-primary, #1b4332)" }}
          className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm"
        >
          {label.charAt(0)}
        </span>
        <div className="text-left">
          <p className="text-sm font-semibold leading-tight text-charcoal">
            {label}
          </p>
          <p className="text-xs text-muted">Secure checkout</p>
        </div>
      </header>

      <div className="relative mt-7 flex items-center justify-center">
        <span className="relative flex h-28 w-28 items-center justify-center">
          <span className={ring}>
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
                strokeDasharray={expired ? "100 0" : "26 74"}
                style={{ stroke: "var(--brand-accent, #d4a017)" }}
              />
            </svg>
          </span>
          <span
            className="relative"
            style={{ color: "var(--brand-primary, #1b4332)" }}
          >
            {METHOD_ICON[method]}
          </span>
        </span>
      </div>

      {showAmount && (
        <p className="relative mt-5 font-heading text-4xl font-semibold tracking-tight text-charcoal">
          {formatMoney(amountMinor, currency)}
        </p>
      )}
      <p className="relative mt-1.5 text-xs font-medium uppercase tracking-widest text-muted">
        {methodLabel ?? METHOD_LABEL[method]}
      </p>

      <div className="relative mt-5 flex min-h-[3.25rem] flex-col items-center justify-center">
        <p
          key={variant === "waiting" || expired ? "static" : index}
          className={`text-sm font-medium text-charcoal ${
            variant === "overlay" && !expired ? "animate-status-in" : ""
          }`}
        >
          {statusText}
        </p>
        <p className="mt-1.5 max-w-[16rem] text-xs leading-relaxed text-muted">
          {statusHint}
        </p>
      </div>

      {variant === "waiting" && typeof progress === "number" && !expired && (
        <div className="relative mx-auto mt-5 h-1 w-full max-w-[14rem] overflow-hidden rounded-full bg-charcoal/10">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progress}%`,
              background: "var(--brand-accent, #d4a017)",
            }}
          />
        </div>
      )}

      {footer ? (
        <div className="relative mt-7 border-t border-charcoal/10 pt-5">
          {footer}
        </div>
      ) : (
        <p className="relative mt-7 border-t border-charcoal/10 pt-4 text-[11px] text-muted">
          Don&apos;t close this window while payment completes.
        </p>
      )}

      <p className="relative mt-5 inline-flex items-center gap-1.5 text-xs text-muted">
        Powered by
        <span className="font-heading text-sm font-semibold tracking-tight text-charcoal">
          venfii<span className="text-gold">.</span>
        </span>
      </p>
    </div>
  );

  if (variant === "waiting") {
    return (
      <div className="animate-sheet-in mx-auto w-full max-w-sm">
        {card}
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
    >
      <div
        aria-hidden="true"
        className="animate-fade-in absolute inset-0 bg-charcoal/45 backdrop-blur-md"
      />
      <div className="relative animate-sheet-in">{card}</div>
    </div>
  );
}
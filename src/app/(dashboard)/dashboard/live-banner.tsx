"use client";

import { useState } from "react";
import {
  CheckIcon,
  ClipboardIcon,
  RocketLaunchIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export function LiveBanner({ subdomain }: { subdomain: string }) {
  const [dismissed, setDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const url = `https://${subdomain}.venfii.com`;

  if (dismissed) return null;

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-pine/20 bg-gradient-to-br from-pine via-pine-dark to-[#0f2c20] p-6 text-white shadow-xl sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gold/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-pine-light/20 blur-3xl"
      />
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-white/50 transition hover:text-white"
        aria-label="Dismiss"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/20">
            <RocketLaunchIcon className="h-6 w-6 text-gold" />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold">
              Your store is live!
            </h2>
            <p className="mt-1 text-sm text-white/70">
              Share this link with your customers to start selling.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code className="rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-gold">
                {url}
              </code>
              <button
                onClick={copy}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                {copied ? (
                  <>
                    <CheckIcon className="h-4 w-4 text-green-400" /> Copied
                  </>
                ) : (
                  <>
                    <ClipboardIcon className="h-4 w-4" /> Copy link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-charcoal transition hover:bg-gold/90 hover:shadow-lg"
        >
          Visit your store
          <ArrowTopRightIcon className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}

function ArrowTopRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
      />
    </svg>
  );
}

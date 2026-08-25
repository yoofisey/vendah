"use client";

import { useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isMobile(): boolean {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent;
  return /Android|iPhone|iPad|iPod/i.test(ua);
}

export function PWAInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isMobile()) return;

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) return;

    function handler(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setVisible(false);
      setDeferred(null);
    }
  }

  function dismiss() {
    setVisible(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <div className="mx-auto flex max-w-lg items-center gap-4 rounded-2xl border border-white/70 bg-white p-4 shadow-[0_16px_40px_-12px_rgba(27,67,50,0.45)]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pine">
          <span className="h-3 w-3 rounded-full bg-gold" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-charcoal">
            Add Vendah to your Home Screen
          </p>
          <p className="mt-0.5 text-xs text-muted">
            Quick access to your favourite shop
          </p>
        </div>
        <button
          onClick={install}
          className="shrink-0 rounded-lg bg-pine px-4 py-2 text-xs font-semibold text-white transition duration-150 hover:bg-pine-dark"
        >
          Install
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-lg p-1.5 text-muted transition duration-150 hover:bg-cream hover:text-charcoal"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

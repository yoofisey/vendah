"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { VendahLogo } from "@/components/vendah-logo";

const SPLASH_ROUTES: Record<string, string> = {
  "/sign-in": "Signing you in...",
  "/sign-up": "Opening your shop...",
  "/onboarding": "Setting up your shop...",
  "/dashboard": "Loading your dashboard...",
};

const COVERED_PREFIXES = ["/sign-in", "/sign-up", "/onboarding", "/dashboard"];

function getSplashMessage(pathname: string): string | null {
  if (SPLASH_ROUTES[pathname]) return SPLASH_ROUTES[pathname];
  for (const prefix of COVERED_PREFIXES) {
    if (pathname.startsWith(prefix + "/")) {
      return SPLASH_ROUTES[prefix] ?? "Loading...";
    }
  }
  return null;
}

export function RouteTransitionSplash() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      const msg = getSplashMessage(pathname);
      if (msg) {
        setMessage(msg);
        setShow(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setShow(false), 5000);
      }
      prevPath.current = pathname;
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream">
      <div className="flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <VendahLogo />
        </div>
        <p className="text-sm font-medium text-charcoal-soft animate-pulse">
          {message}
        </p>
        <div className="mt-4 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-pine animate-bounce" />
        </div>
      </div>
    </div>
  );
}

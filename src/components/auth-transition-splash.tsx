"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { VenfiiLogo } from "@/components/venfii-logo";

type TransitionState = { message: string } | null;

type AuthTransitionContextValue = {
  begin: (message?: string) => void;
  end: () => void;
};

const AuthTransitionContext = createContext<AuthTransitionContextValue | null>(
  null
);

const AUTH_ROUTES = ["/sign-in", "/sign-up", "/reset-password", "/update-password"];

function isAuthRoute(pathname: string): boolean {
  for (const route of AUTH_ROUTES) {
    if (pathname === route || pathname.startsWith(`${route}/`)) return true;
  }
  return pathname.startsWith("/auth");
}

export function AuthTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [active, setActive] = useState<TransitionState>(null);
  const [fading, setFading] = useState(false);
  const startedAt = useRef(0);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPath = useRef(pathname);

  const fadeOut = useCallback(() => {
    setFading(true);
  }, []);

  const end = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
    fadeOut();
  }, [fadeOut]);

  const begin = useCallback((message = "Loading…") => {
    startedAt.current = Date.now();
    setFading(false);
    setActive({ message });
  }, []);

  // Fade the splash out shortly after landing on a non-auth destination
  // (e.g. /onboarding or a dashboard route after a successful action redirect).
  useEffect(() => {
    const previous = prevPath.current;
    prevPath.current = pathname;
    if (!active || pathname === previous) return;
    if (isAuthRoute(pathname)) return;

    const elapsed = Date.now() - startedAt.current;
    const delay = Math.max(0, 1100 - elapsed);
    hideTimer.current = setTimeout(fadeOut, delay);
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
    };
  }, [pathname, active, fadeOut]);

  useEffect(() => {
    if (!fading) return;
    const t = setTimeout(() => setActive(null), 320);
    return () => clearTimeout(t);
  }, [fading]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    []
  );

  return (
    <AuthTransitionContext.Provider value={{ begin, end }}>
      {children}
      {active && (
        <div
          className={`fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-hidden bg-cream px-6 transition-opacity duration-300 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
          role="status"
          aria-busy="true"
          aria-label="Loading"
        >
          <div className="flex w-full max-w-sm flex-col items-center text-center">
            <div className="animate-pulse">
              <VenfiiLogo />
            </div>
            <p className="mt-5 text-sm font-medium text-charcoal-soft animate-pulse">
              {active.message}
            </p>
            <div className="mt-5 flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-pine animate-bounce" />
            </div>
          </div>
        </div>
      )}
    </AuthTransitionContext.Provider>
  );
}

export function useAuthTransition(): AuthTransitionContextValue {
  const ctx = useContext(AuthTransitionContext);
  if (!ctx) {
    throw new Error("useAuthTransition must be used within AuthTransitionProvider");
  }
  return ctx;
}
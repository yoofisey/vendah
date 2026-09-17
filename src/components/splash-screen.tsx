"use client";

import { useEffect, useState } from "react";
import { VenfiiLogo } from "@/components/venfii-logo";

export function SplashScreen({
  message,
  minDuration = 5000,
}: {
  message?: string;
  minDuration?: number;
}) {
  const [phase, setPhase] = useState<"fade-in" | "visible" | "fade-out">("fade-in");

  useEffect(() => {
    const fadeIn = setTimeout(() => setPhase("visible"), 50);
    const fadeOut = setTimeout(() => setPhase("fade-out"), minDuration);
    return () => {
      clearTimeout(fadeIn);
      clearTimeout(fadeOut);
    };
  }, [minDuration]);

  if (phase === "fade-out") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream transition-opacity duration-700 ${
        phase === "visible" ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="animate-pulse">
          <VenfiiLogo className="h-16 w-auto" />
        </div>
        {message && (
          <p className="text-sm font-medium text-charcoal-soft animate-pulse">
            {message}
          </p>
        )}
        <div className="mt-4 flex gap-1.5">
          <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-pine animate-bounce" />
        </div>
      </div>
    </div>
  );
}

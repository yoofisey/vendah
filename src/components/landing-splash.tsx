"use client";

import { useEffect, useState } from "react";
import { VenfiiLogo } from "@/components/venfii-logo";

export function LandingSplash() {
  const [visible, setVisible] = useState(true);
  const [phase, setPhase] = useState<"in" | "visible" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 60);
    const t2 = setTimeout(() => setPhase("out"), 2600);
    const t3 = setTimeout(() => setVisible(false), 3300);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex min-h-dvh items-center justify-center overflow-hidden bg-cream px-6 transition-opacity duration-700 ease-out ${
        phase === "out" ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div
          className={`transition-all duration-700 ease-out ${
            phase === "out"
              ? "opacity-0 -translate-y-3"
              : phase === "visible"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-4"
          }`}
        >
          <VenfiiLogo className="h-16 w-auto" />
        </div>

        <div
          className={`flex flex-col items-center gap-3 transition-all duration-700 delay-200 ease-out ${
            phase === "out"
              ? "opacity-0 -translate-y-2"
              : phase === "visible"
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-3"
          }`}
        >
          <p className="text-sm font-medium text-charcoal-soft">
            Sell smarter with your own shop
          </p>
          <div className="flex gap-1.5">
            <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.3s]" />
            <span className="h-2 w-2 rounded-full bg-pine animate-bounce [animation-delay:-0.15s]" />
            <span className="h-2 w-2 rounded-full bg-pine animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
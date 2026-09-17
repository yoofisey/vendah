"use client";

import { useEffect, useState } from "react";
import { VenfiiLogo } from "@/components/venfii-logo";

const WORDMARK = ["v", "e", "n", "f", "i", "i"];

export function LandingSplash() {
  const [phase, setPhase] = useState<"in" | "spell" | "out">("in");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("spell"), 1450);
    const t2 = setTimeout(() => setPhase("out"), 2450);
    const t3 = setTimeout(() => setVisible(false), 3350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (!visible) return null;

  const spellOn = phase !== "in";

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-cream transition-all duration-700 ease-out ${
        phase === "out"
          ? "motion-safe:animate-splash-out motion-reduce:opacity-0 pointer-events-none"
          : "opacity-100"
      }`}
    >
      <div
        aria-hidden="true"
        className="animate-fade-in pointer-events-none absolute inset-0 bg-[radial-gradient(58rem_40rem_at_50%_-18%,rgba(212,160,23,0.14),transparent_62%),radial-gradient(44rem_34rem_at_88%_112%,rgba(166,65,83,0.09),transparent_56%)]"
      />

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center">
          <div className="relative flex flex-col items-center">
            <div
              className={`relative transition-[opacity,transform,filter] duration-300 ease-out ${
                spellOn ? "pointer-events-none opacity-0 scale-105 blur-[6px]" : "opacity-100"
              }`}
            >
              <div className="motion-safe:animate-signature-in">
                <span className="font-script text-[3.6rem] leading-none text-berry">
                  venfii<span className="text-gold">.</span>
                </span>
              </div>
              <svg
                viewBox="0 0 260 24"
                aria-hidden="true"
                fill="none"
                className="absolute -bottom-2 left-0 h-5 w-full overflow-visible [transform-origin:left] motion-safe:animate-swoosh-sweep"
                style={{ animationDelay: "0.45s" }}
              >
                <path
                  d="M2 18 C 60 6, 120 8, 160 15 S 235 20, 258 10"
                  stroke="var(--color-gold)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {spellOn && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex font-heading text-[3.4rem] font-semibold leading-none tracking-tight">
                  {WORDMARK.map((ch, i) => (
                    <span
                      key={i}
                      className="animate-wordmark-letter text-berry opacity-0 motion-reduce:opacity-100"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      {ch}
                    </span>
                  ))}
                  <span
                    className="animate-wordmark-letter text-gold opacity-0 motion-reduce:opacity-100"
                    style={{ animationDelay: `${WORDMARK.length * 70 + 40}ms` }}
                  >
                    .
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            className={`mt-9 flex flex-col items-center gap-3 transition-all duration-500 ease-out ${
              spellOn ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
            }`}
          >
            <p className="text-sm font-medium text-charcoal-soft">
              Sell smarter with your own shop
            </p>
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-gold animate-bounce [animation-delay:-0.3s]" />
              <span className="h-2 w-2 rounded-full bg-gold animate-bounce [animation-delay:-0.15s]" />
              <span className="h-2 w-2 rounded-full bg-gold animate-bounce" />
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-5">
          <VenfiiLogo className="h-7 w-auto opacity-70" />
        </div>
      </div>
    </div>
  );
}
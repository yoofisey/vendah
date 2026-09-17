"use client";

import { useEffect, useState } from "react";

export function LandingSplash() {
  const [out, setOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setOut(true), 2450);
    const t2 = setTimeout(() => setVisible(false), 3350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] overflow-hidden bg-cream transition-all duration-700 ease-out ${
        out
          ? "motion-safe:animate-splash-out motion-reduce:opacity-0 pointer-events-none"
          : "opacity-100"
      }`}
    >
      <div
        aria-hidden="true"
        className="animate-fade-in pointer-events-none absolute inset-0 bg-[radial-gradient(58rem_40rem_at_50%_-18%,rgba(212,160,23,0.14),transparent_62%),radial-gradient(44rem_34rem_at_88%_112%,rgba(166,65,83,0.09),transparent_56%)]"
      />

      <div className="relative flex min-h-dvh flex-col items-center justify-center px-6">
        <div className="relative flex flex-col items-center">
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
      </div>
    </div>
  );
}
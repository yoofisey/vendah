"use client";

import { useEffect, useRef, type ReactNode } from "react";

const DIRECTIONS = {
  up: { from: "translate-y-16 opacity-0", to: "translate-y-0 opacity-100" },
  left: { from: "-translate-x-16 opacity-0", to: "translate-x-0 opacity-100" },
  right: { from: "translate-x-16 opacity-0", to: "translate-x-0 opacity-100" },
} as const;

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  direction?: "up" | "left" | "right";
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.classList.remove(...DIRECTIONS[direction].from.split(" "));
            el.classList.add(...DIRECTIONS[direction].to.split(" "));
          }, delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, direction]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${DIRECTIONS[direction].from} ${className}`}
    >
      {children}
    </div>
  );
}

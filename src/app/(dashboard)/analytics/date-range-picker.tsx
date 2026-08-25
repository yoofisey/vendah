"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const presets = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "This month", days: "this_month" as const },
  { label: "Last 3 months", days: 90 },
] as const;

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getPresetRange(days: number | "this_month") {
  const now = new Date();
  if (days === "this_month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from: toDateStr(from), to: toDateStr(now) };
  }
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return { from: toDateStr(from), to: toDateStr(now) };
}

export function DateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";

  const applyRange = useCallback(
    (from: string, to: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("from", from);
      params.set("to", to);
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const isActive = (days: number | "this_month") => {
    const { from, to } = getPresetRange(days);
    return currentFrom === from && currentTo === to;
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-charcoal">From</label>
        <input
          type="date"
          value={currentFrom}
          onChange={(e) => applyRange(e.target.value, currentTo)}
          className="rounded-lg border border-charcoal/15 bg-cream px-3 py-1.5 text-sm text-charcoal transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-charcoal">To</label>
        <input
          type="date"
          value={currentTo}
          onChange={(e) => applyRange(currentFrom, e.target.value)}
          className="rounded-lg border border-charcoal/15 bg-cream px-3 py-1.5 text-sm text-charcoal transition focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => {
          const active = isActive(p.days);
          return (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                const { from, to } = getPresetRange(p.days);
                applyRange(from, to);
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition duration-200 ${
                active
                  ? "bg-pine text-white shadow"
                  : "bg-cream text-charcoal hover:bg-pine/10"
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

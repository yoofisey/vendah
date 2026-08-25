"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function PriceRangeFilter({
  min,
  max,
}: {
  min?: number;
  max?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const apply = useCallback(
    (minVal: string, maxVal: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (minVal) {
        next.set("min_price", minVal);
      } else {
        next.delete("min_price");
      }
      if (maxVal) {
        next.set("max_price", maxVal);
      } else {
        next.delete("max_price");
      }
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`);
      });
    },
    [router, pathname, searchParams, startTransition]
  );

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-muted">Price:</label>
      <input
        type="number"
        min={0}
        placeholder="Min"
        defaultValue={min ?? ""}
        onBlur={(e) => {
          const maxVal = (
            e.currentTarget.parentElement?.querySelector(
              'input[placeholder="Max"]'
            ) as HTMLInputElement | null
          )?.value;
          apply(e.currentTarget.value, maxVal ?? "");
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="w-20 rounded-lg border border-charcoal/15 bg-white px-2.5 py-1.5 text-xs text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      <span className="text-xs text-muted">–</span>
      <input
        type="number"
        min={0}
        placeholder="Max"
        defaultValue={max ?? ""}
        onBlur={(e) => {
          const minVal = (
            e.currentTarget.parentElement?.querySelector(
              'input[placeholder="Min"]'
            ) as HTMLInputElement | null
          )?.value;
          apply(minVal ?? "", e.currentTarget.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        className="w-20 rounded-lg border border-charcoal/15 bg-white px-2.5 py-1.5 text-xs text-charcoal placeholder:text-muted focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      {pending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-charcoal/20 border-t-charcoal" />
      )}
    </div>
  );
}

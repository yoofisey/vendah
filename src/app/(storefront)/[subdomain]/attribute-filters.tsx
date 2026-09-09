"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ATTR_PARAM_PREFIX } from "@/lib/storefront-filters";
import type { ProductFilterDef } from "@/lib/storefront-filters";

export function AttributeFilters({ defs }: { defs: ProductFilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  if (defs.length === 0) return null;

  const toggle = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    const param = `${ATTR_PARAM_PREFIX}${key}`;
    if (next.get(param) === value) {
      next.delete(param);
    } else {
      next.set(param, value);
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  };

  const clearAll = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of [...next.keys()]) {
      if (key.startsWith(ATTR_PARAM_PREFIX)) next.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${next.toString()}`);
    });
  };

  const activeCount = [...searchParams.keys()].filter((key) =>
    key.startsWith(ATTR_PARAM_PREFIX)
  ).length;

  return (
    <div className="space-y-3 rounded-2xl border border-charcoal/10 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-muted">
          Filters
        </p>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-pine transition duration-150 hover:text-pine-dark"
          >
            Clear all
            {pending && (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-charcoal/20 border-t-pine" />
            )}
          </button>
        )}
      </div>
      {defs.map((def) => {
        const selected = searchParams.get(
          `${ATTR_PARAM_PREFIX}${def.key}`
        );
        return (
          <div key={def.key} className="flex flex-wrap items-start gap-x-3 gap-y-2">
            <span className="w-28 shrink-0 pt-1.5 text-sm font-medium text-charcoal-soft">
              {def.label}
            </span>
            <div className="flex flex-wrap gap-2">
              {def.values.map((option) => {
                const isSelected = selected === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(def.key, option.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition duration-150 ${
                      isSelected
                        ? "border-pine bg-pine text-white"
                        : "border-charcoal/15 bg-cream text-charcoal-soft hover:border-pine hover:text-pine"
                    }`}
                  >
                    {option.value}
                    <span
                      className={isSelected ? "text-white/70" : "text-muted"}
                    >
                      {" "}({option.count})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
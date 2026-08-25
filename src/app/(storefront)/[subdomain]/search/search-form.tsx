"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function SearchForm({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-xl border border-charcoal/15 bg-white py-3 pl-11 pr-4 text-sm text-charcoal shadow-sm outline-none transition duration-200 focus:border-pine focus:ring-2 focus:ring-pine/20"
        />
      </div>
      <button
        type="submit"
        className="shrink-0 rounded-xl bg-pine px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-pine-dark"
      >
        Search
      </button>
    </form>
  );
}

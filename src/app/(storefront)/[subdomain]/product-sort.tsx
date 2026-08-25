"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "popular", label: "Most popular" },
];

export function ProductSort({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <select
      value={value}
      aria-label="Sort products"
      onChange={(e) => {
        const next = new URLSearchParams(searchParams.toString());
        next.set("sort", e.target.value);
        router.push(`${pathname}?${next.toString()}`);
      }}
      className="cursor-pointer rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm font-medium text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
    >
      {OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

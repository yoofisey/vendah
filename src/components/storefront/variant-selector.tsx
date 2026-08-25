"use client";

import { useState } from "react";

import type { ProductVariant } from "@/lib/types";

type Props = {
  variants: ProductVariant[];
  basePrice: number;
  onVariantChange: (variant: ProductVariant | null) => void;
};

export function VariantSelector({ variants, basePrice, onVariantChange }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (variants.length === 0) return null;

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  function select(id: string) {
    const variant = variants.find((v) => v.id === id) ?? null;
    setSelectedId(id);
    onVariantChange(variant);
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-charcoal">Select variant</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => select(variant.id)}
              disabled={variant.stock === 0}
              className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${
                isSelected
                  ? "border-gold bg-gold/[0.06] text-charcoal shadow-md"
                  : "border-charcoal/15 bg-cream text-charcoal-soft hover:border-charcoal/25"
              }`}
            >
              {variant.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

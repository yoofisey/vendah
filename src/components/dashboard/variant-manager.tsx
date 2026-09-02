"use client";

import { useState } from "react";
import { saveVariants, deleteVariant } from "@/app/(dashboard)/products/actions";

type Variant = {
  id?: string;
  name: string;
  sku: string | null;
  price_override_minor: number | null;
  stock: number;
  attributes: Record<string, string>;
  sort_order: number;
};

type Dimension = {
  key: string;
  label: string;
  values: string;
};

type Props = {
  tenantId: string;
  productId: string;
  variants: Variant[];
  attributeDefs: { key: string; label: string; type: string; options?: string[] }[];
  onChange?: () => void;
};

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [];
  return arrays.reduce<T[][]>(
    (acc, curr) => acc.flatMap((combo) => curr.map((value) => [...combo, value])),
    [[]]
  );
}

function attrsKey(attributes: Record<string, string>): string {
  return JSON.stringify(Object.entries(attributes).sort());
}

export function VariantManager({ tenantId, productId, variants: initial, attributeDefs, onChange }: Props) {
  const [variants, setVariants] = useState<Variant[]>(initial);
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState<Partial<Variant>>({
    name: "",
    sku: "",
    price_override_minor: null,
    stock: 0,
    attributes: {},
  });
  const [showAddForm, setShowAddForm] = useState(false);

  const [generatorOpen, setGeneratorOpen] = useState(false);
  const [dimensions, setDimensions] = useState<Dimension[]>(() =>
    (attributeDefs ?? [])
      .filter((d) => d.type === "select")
      .map((d) => ({
        key: d.key,
        label: d.label,
        values: (d.options ?? []).join(", "),
      }))
  );
  const [genStock, setGenStock] = useState<number>(0);
  const [genPrice, setGenPrice] = useState<string>("");

  function addDimension() {
    setDimensions((prev) => [
      ...prev,
      { key: `dim${prev.length + 1}`, label: "", values: "" },
    ]);
  }

  function updateDimension(index: number, patch: Partial<Dimension>) {
    setDimensions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d))
    );
  }

  function removeDimension(index: number) {
    setDimensions((prev) => prev.filter((_, i) => i !== index));
  }

  function applyMatrix() {
    const cleaned = dimensions
      .map((d) => ({
        ...d,
        label: d.label.trim(),
        values: d.values
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
      }))
      .filter((d) => d.label && d.values.length > 0);

    if (cleaned.length === 0) {
      setError("Add at least one dimension with options to generate variants.");
      return;
    }

    const combos = cartesianProduct(
      cleaned.map((d) => d.values.map((v) => ({ dim: d, value: v })))
    );

    const price = genPrice ? Math.round(Number(genPrice) * 100) : null;

    const generated: Variant[] = combos.map((combo, i) => {
      const attributes: Record<string, string> = {};
      const nameParts: string[] = [];
      for (const { dim, value } of combo) {
        attributes[dim.key] = value;
        nameParts.push(value);
      }
      return {
        name: nameParts.join(" / "),
        sku: "",
        price_override_minor: price,
        stock: genStock,
        attributes,
        sort_order: variants.length + i,
      };
    });

    if (generated.length === 0) return;

    setVariants((prev) => {
      const merged = [...prev];
      for (const g of generated) {
        const gKey = attrsKey(g.attributes);
        const existingIndex = prev.findIndex((p) => {
          if (!p.attributes || Object.keys(p.attributes).length === 0)
            return false;
          return attrsKey(p.attributes) === gKey;
        });
        if (existingIndex >= 0) {
          merged[existingIndex] = {
            ...merged[existingIndex],
            ...g,
            id: merged[existingIndex].id,
          };
        } else {
          merged.push(g);
        }
      }
      return merged;
    });

    setGeneratorOpen(false);
    setError(null);
  }

  function moveVariant(index: number, direction: "up" | "down") {
    setVariants((prev) => {
      const arr = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= arr.length) return prev;
      [arr[index], arr[swapIndex]] = [arr[swapIndex], arr[index]];
      return arr.map((v, i) => ({ ...v, sort_order: i }));
    });
  }

  function removeVariant(index: number) {
    const variant = variants[index];
    setVariants((prev) => prev.filter((_, i) => i !== index));
    if (variant.id) {
      deleteVariant(variant.id).catch(() => {});
    }
  }

  function addVariant() {
    if (!newVariant.name?.trim()) {
      setError("Variant name is required.");
      return;
    }
    setVariants((prev) => [
      ...prev,
      {
        ...newVariant,
        name: newVariant.name!.trim(),
        sku: newVariant.sku ?? "",
        price_override_minor: newVariant.price_override_minor ?? null,
        stock: newVariant.stock ?? 0,
        attributes: newVariant.attributes ?? {},
        sort_order: prev.length,
      },
    ]);
    setNewVariant({ name: "", sku: "", price_override_minor: null, stock: 0, attributes: {} });
    setShowAddForm(false);
    setError(null);
  }

  async function handleSave() {
    setPending(true);
    setError(null);
    try {
      const result = await saveVariants(productId, variants);
      if (result?.error) {
        setError(result.error);
      } else {
        setEditing(false);
        onChange?.();
      }
    } catch {
      setError("Failed to save variants.");
    }
    setPending(false);
  }

  return (
    <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-lg font-semibold text-charcoal">Variants</h2>
          <p className="mt-0.5 text-xs text-muted">
            e.g. shirt sizes and colours
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setVariants(initial);
                  setShowAddForm(false);
                  setGeneratorOpen(false);
                  setError(null);
                }}
                className="rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal-soft transition hover:bg-cream"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending}
                className="rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pine-dark disabled:opacity-60"
              >
                {pending ? "Saving..." : "Save variants"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal-soft transition hover:bg-cream"
            >
              Edit variants
            </button>
          )}
        </div>
      </div>

      {!editing && variants.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No variants yet. Click &quot;Edit variants&quot; to add sizes, colors, or other options.
        </p>
      )}

      {editing && (
        <div className="mt-4 space-y-3">
          {variants.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="flex flex-wrap items-start gap-3 rounded-lg border border-charcoal/10 bg-cream/50 p-4"
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveVariant(index, "up")}
                  disabled={index === 0}
                  className="flex h-6 w-6 items-center justify-center rounded border border-charcoal/15 text-xs text-charcoal-soft transition hover:bg-white disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveVariant(index, "down")}
                  disabled={index === variants.length - 1}
                  className="flex h-6 w-6 items-center justify-center rounded border border-charcoal/15 text-xs text-charcoal-soft transition hover:bg-white disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <div className="flex-1 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                <input
                  value={variant.name}
                  onChange={(e) => {
                    setVariants((prev) =>
                      prev.map((v, i) => (i === index ? { ...v, name: e.target.value } : v))
                    );
                  }}
                  placeholder="Name (e.g. Large)"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  value={variant.sku ?? ""}
                  onChange={(e) => {
                    setVariants((prev) =>
                      prev.map((v, i) => (i === index ? { ...v, sku: e.target.value } : v))
                    );
                  }}
                  placeholder="SKU (optional)"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="number"
                  min="0"
                  value={variant.stock}
                  onChange={(e) => {
                    setVariants((prev) =>
                      prev.map((v, i) => (i === index ? { ...v, stock: Number(e.target.value) } : v))
                    );
                  }}
                  placeholder="Stock"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={variant.price_override_minor != null ? (variant.price_override_minor / 100).toFixed(2) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setVariants((prev) =>
                      prev.map((v, i) =>
                        i === index
                          ? { ...v, price_override_minor: val ? Math.round(Number(val) * 100) : null }
                          : v
                      )
                    );
                  }}
                  placeholder="Price override (GH₵)"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              {attributeDefs.length > 0 && (
                <div className="w-full flex flex-wrap gap-2">
                  {attributeDefs.map((def) => (
                    <div key={def.key} className="flex items-center gap-1.5">
                      <label className="text-xs text-muted">{def.label}:</label>
                      {def.type === "select" ? (
                        <select
                          value={variant.attributes[def.key] ?? ""}
                          onChange={(e) => {
                            setVariants((prev) =>
                              prev.map((v, i) =>
                                i === index
                                  ? { ...v, attributes: { ...v.attributes, [def.key]: e.target.value } }
                                  : v
                              )
                            );
                          }}
                          className="rounded border border-charcoal/15 px-2 py-1 text-xs focus:border-gold focus:outline-none"
                        >
                          <option value="">--</option>
                          {(def.options ?? []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          value={variant.attributes[def.key] ?? ""}
                          onChange={(e) => {
                            setVariants((prev) =>
                              prev.map((v, i) =>
                                i === index
                                  ? { ...v, attributes: { ...v.attributes, [def.key]: e.target.value } }
                                  : v
                              )
                            );
                          }}
                          className="w-24 rounded border border-charcoal/15 px-2 py-1 text-xs focus:border-gold focus:outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => removeVariant(index)}
                className="text-xs font-medium text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ))}

          {!showAddForm ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(true);
                  setGeneratorOpen(false);
                }}
                className="rounded-lg border border-dashed border-charcoal/20 px-4 py-2 text-sm font-medium text-charcoal-soft transition hover:border-gold hover:text-gold"
              >
                + Add variant
              </button>
              <button
                type="button"
                onClick={() => {
                  setGeneratorOpen((v) => !v);
                  setShowAddForm(false);
                  setError(null);
                }}
                className="rounded-lg border border-dashed border-pine/40 px-4 py-2 text-sm font-medium text-pine transition hover:border-pine hover:bg-pine/5"
              >
                ⚡ Generate variants (colors × sizes)
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-gold/30 bg-gold/[0.03] p-4 space-y-3">
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                <input
                  value={newVariant.name ?? ""}
                  onChange={(e) => setNewVariant((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Name (e.g. Size L)"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  value={newVariant.sku ?? ""}
                  onChange={(e) => setNewVariant((prev) => ({ ...prev, sku: e.target.value }))}
                  placeholder="SKU (optional)"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="number"
                  min="0"
                  value={newVariant.stock ?? 0}
                  onChange={(e) => setNewVariant((prev) => ({ ...prev, stock: Number(e.target.value) }))}
                  placeholder="Stock"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newVariant.price_override_minor != null ? (newVariant.price_override_minor / 100).toFixed(2) : ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewVariant((prev) => ({
                      ...prev,
                      price_override_minor: val ? Math.round(Number(val) * 100) : null,
                    }));
                  }}
                  placeholder="Price override (GH₵)"
                  className="rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={addVariant}
                  className="rounded-lg bg-pine px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-pine-dark"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-lg border border-charcoal/15 px-3 py-1.5 text-xs font-medium text-charcoal-soft transition hover:bg-cream"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {generatorOpen && (
            <div className="rounded-lg border border-pine/30 bg-pine/[0.03] p-4 space-y-4">
              <div>
                <p className="text-sm font-semibold text-charcoal">
                  Generate variant combinations
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  Enter options for each attribute and Vendah creates every
                  combination (e.g. Red × S, Red × M, Blue × S…).
                </p>
              </div>

              {dimensions.length === 0 && (
                <p className="text-xs text-muted">
                  No size/colour attributes found for this product&apos;s
                  category. Add a dimension below.
                </p>
              )}

              <div className="space-y-3">
                {dimensions.map((dim, i) => (
                  <div key={i} className="rounded-lg border border-charcoal/10 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-medium text-charcoal-soft">
                        Dimension {i + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeDimension(i)}
                        className="text-xs font-medium text-red-500 hover:text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs text-muted">Label</label>
                        <input
                          value={dim.label}
                          onChange={(e) => updateDimension(i, { label: e.target.value })}
                          placeholder="e.g. Colour, Size"
                          className="w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs text-muted">
                          Options (comma-separated)
                        </label>
                        <input
                          value={dim.values}
                          onChange={(e) => updateDimension(i, { values: e.target.value })}
                          placeholder="e.g. Red, Blue, Green"
                          className="w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addDimension}
                className="rounded-lg border border-dashed border-charcoal/20 px-4 py-2 text-xs font-medium text-charcoal-soft transition hover:border-gold hover:text-gold"
              >
                + Add dimension
              </button>

              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Default stock per variant
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={genStock}
                    onChange={(e) => setGenStock(Number(e.target.value))}
                    placeholder="e.g. 10"
                    className="w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">
                    Price override per variant (GH₵, optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={genPrice}
                    onChange={(e) => setGenPrice(e.target.value)}
                    placeholder="e.g. 45.00"
                    className="w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={applyMatrix}
                  className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white transition hover:bg-pine-dark"
                >
                  Generate combinations
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratorOpen(false)}
                  className="rounded-lg border border-charcoal/15 px-4 py-2 text-xs font-medium text-charcoal-soft transition hover:bg-cream"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!editing && variants.length > 0 && (
        <div className="mt-4 divide-y divide-charcoal/5 border border-charcoal/10 rounded-lg">
          {variants.map((variant) => (
            <div key={variant.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-charcoal">{variant.name}</span>
                {variant.sku && <span className="ml-2 text-xs text-muted">SKU: {variant.sku}</span>}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                {variant.price_override_minor != null && (
                  <span>GH₵{(variant.price_override_minor / 100).toFixed(2)}</span>
                )}
                <span>Stock: {variant.stock}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </section>
  );
}

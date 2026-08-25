"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useActionState } from "react";
import { saveProduct } from "./actions";
import { createClient } from "@/lib/supabase/client";
import type { AttributeDef, Product, ProductCategory } from "@/lib/types";

type Props = {
  tenantId: string;
  attributeDefs: AttributeDef[];
  categories: ProductCategory[];
  product?: Product | null;
};

export function ProductForm({ tenantId, attributeDefs, categories, product }: Props) {
  const router = useRouter();
  const [state, action, pending] = useActionState(saveProduct, {});
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [imageAlts, setImageAlts] = useState<string[]>(product?.image_alts ?? []);
  const [attributes, setAttributes] = useState<Record<string, string>>(
    product?.attributes ?? {}
  );
  const [folderKey, setFolderKey] = useState(product?.id ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [seoOpen, setSeoOpen] = useState(false);

  useEffect(() => {
    if (state.success) router.push("/products");
  }, [state, router]);

  async function uploadImage(file: File) {
    const key = folderKey || crypto.randomUUID();
    if (!folderKey) setFolderKey(key);
    setUploading(true);
    setUploadError(null);
    const supabase = createClient();
    const path = `${tenantId}/${key}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { cacheControl: "3600" });
    if (error) {
      setUploadError(error.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);
    setImages((prev) => [...prev, publicUrl]);
    setImageAlts((prev) => [...prev, ""]);
    setUploading(false);
  }

  function removeImage(url: string) {
    const index = images.indexOf(url);
    setImages((prev) => prev.filter((u) => u !== url));
    setImageAlts((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index: number, direction: "up" | "down") {
    setImages((prev) => {
      const arr = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= arr.length) return prev;
      [arr[index], arr[swapIndex]] = [arr[swapIndex], arr[index]];
      return arr;
    });
    setImageAlts((prev) => {
      const arr = [...prev];
      const swapIndex = direction === "up" ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= arr.length) return prev;
      [arr[index], arr[swapIndex]] = [arr[swapIndex], arr[index]];
      return arr;
    });
  }

  function setPrimary(index: number) {
    if (index === 0) return;
    setImages((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
      return arr;
    });
    setImageAlts((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(index, 1);
      arr.unshift(item);
      return arr;
    });
  }

  function updateAlt(index: number, value: string) {
    setImageAlts((prev) => prev.map((a, i) => (i === index ? value : a)));
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="images" value={JSON.stringify(images)} />
      <input type="hidden" name="imageAlts" value={JSON.stringify(imageAlts)} />
      <input
        type="hidden"
        name="attributes"
        value={JSON.stringify(attributes)}
      />

      <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
        />
        <div className="relative grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-charcoal-soft">
              Product name
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={product?.name ?? ""}
              placeholder="e.g. African Print Dress"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-charcoal-soft">
              Price (GH₵)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              required
              min="0.01"
              step="0.01"
              defaultValue={product ? (product.price_minor / 100).toFixed(2) : ""}
              placeholder="150.00"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-charcoal-soft">
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              required
              min="0"
              defaultValue={product?.stock ?? 0}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-charcoal-soft">
              SKU
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              defaultValue={product?.sku ?? ""}
              placeholder="Stock Keeping Unit"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label htmlFor="weight_grams" className="block text-sm font-medium text-charcoal-soft">
              Weight in grams
            </label>
            <input
              id="weight_grams"
              name="weight_grams"
              type="number"
              min="0"
              defaultValue={product?.weight_grams ?? ""}
              placeholder="e.g. 500"
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-charcoal-soft">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={product?.status ?? "draft"}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="draft">Draft (hidden)</option>
              <option value="active">Active (visible on storefront)</option>
            </select>
          </div>
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-charcoal-soft">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={product?.category_id ?? ""}
              className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
            >
              <option value="">None</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
                className="h-4 w-4 rounded border-charcoal/20 text-pine focus:ring-pine"
              />
              <span className="font-medium">Featured on storefront</span>
            </label>
          </div>
        </div>
        <div className="relative mt-5">
          <label htmlFor="description" className="block text-sm font-medium text-charcoal-soft">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            placeholder="Fabric, fit, and anything else shoppers should know."
            className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
        </div>
      </section>

      {attributeDefs.length > 0 && (
        <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          <h2 className="font-heading text-lg font-semibold text-charcoal">Product details</h2>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {attributeDefs.map((def) => (
              <div key={def.key}>
                <label
                  htmlFor={`attr-${def.key}`}
                  className="block text-sm font-medium text-charcoal-soft"
                >
                  {def.label}
                </label>
                {def.type === "select" ? (
                  <select
                    id={`attr-${def.key}`}
                    value={attributes[def.key] ?? ""}
                    onChange={(e) =>
                      setAttributes((prev) => ({
                        ...prev,
                        [def.key]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  >
                    <option value="">Select…</option>
                    {(def.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`attr-${def.key}`}
                    type="text"
                    value={attributes[def.key] ?? ""}
                    onChange={(e) =>
                      setAttributes((prev) => ({
                        ...prev,
                        [def.key]: e.target.value,
                      }))
                    }
                    className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-charcoal">Photos</h2>
          <span className="text-xs text-muted">{images.length} of 8 images</span>
        </div>
        <div className="mt-4 space-y-3">
          {images.map((url, index) => (
            <div key={url} className="flex items-start gap-3 rounded-lg border border-charcoal/10 bg-cream/50 p-3">
              <div className="relative shrink-0">
                <img
                  src={url}
                  alt={imageAlts[index] || "Product"}
                  className="h-20 w-20 rounded-lg object-cover"
                />
                {index === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-pine/90 py-0.5 text-center text-[10px] font-semibold text-white">
                    Primary
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => moveImage(index, "up")}
                    disabled={index === 0}
                    className="flex h-6 w-6 items-center justify-center rounded border border-charcoal/15 text-xs text-charcoal-soft transition hover:bg-white disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(index, "down")}
                    disabled={index === images.length - 1}
                    className="flex h-6 w-6 items-center justify-center rounded border border-charcoal/15 text-xs text-charcoal-soft transition hover:bg-white disabled:opacity-30"
                  >
                    ▼
                  </button>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="ml-1 rounded border border-pine/20 px-2 py-0.5 text-[10px] font-medium text-pine transition hover:bg-pine/5"
                    >
                      Set as primary
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={imageAlts[index] ?? ""}
                  onChange={(e) => updateAlt(index, e.target.value)}
                  placeholder="Image caption / alt text"
                  className="w-full rounded-lg border border-charcoal/15 px-2.5 py-1.5 text-xs text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
                />
              </div>
            </div>
          ))}
          <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-lg border border-dashed border-charcoal/20 text-muted transition duration-150 hover:border-gold hover:text-gold">
            <span className="text-sm">{uploading ? "..." : "+"}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
        <p className="mt-2 text-xs text-muted">
          Square images work best. Up to 8 photos.
        </p>
      </section>

      <section className="rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <button
          type="button"
          onClick={() => setSeoOpen((o) => !o)}
          className="flex w-full items-center justify-between p-7 text-left"
        >
          <h2 className="font-heading text-lg font-semibold text-charcoal">SEO</h2>
          <span className="text-xs text-muted">{seoOpen ? "Hide" : "Show"}</span>
        </button>
        {seoOpen && (
          <div className="-mt-2 space-y-5 border-t border-charcoal/10 px-7 pb-7 pt-5">
            <div>
              <label htmlFor="metaTitle" className="block text-sm font-medium text-charcoal-soft">
                Meta title
              </label>
              <input
                id="metaTitle"
                name="metaTitle"
                type="text"
                maxLength={60}
                defaultValue={product?.meta_title ?? ""}
                placeholder="e.g. African Print Dress | My Shop"
                className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-1 text-xs text-muted">Recommended: 50–60 characters. Appears in search engine results.</p>
            </div>
            <div>
              <label htmlFor="metaDescription" className="block text-sm font-medium text-charcoal-soft">
                Meta description
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={3}
                maxLength={160}
                defaultValue={product?.meta_description ?? ""}
                placeholder="A short summary shown in search results."
                className="mt-1 w-full rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
              />
              <p className="mt-1 text-xs text-muted">Recommended: 120–160 characters.</p>
            </div>
          </div>
        )}
      </section>

      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : product ? "Save changes" : "Create product"}
      </button>
    </form>
  );
}

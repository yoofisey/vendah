"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import { TagIcon } from "@heroicons/react/24/outline";
import type { ProductState } from "./actions";
import type { ProductCategory } from "@/lib/types";

export function CategoryManager({
  categories,
  actions,
}: {
  categories: (ProductCategory & { product_count: number })[];
  actions: {
    createCategory: (
      prevState: ProductState,
      formData: FormData
    ) => Promise<ProductState>;
    deleteCategory: (categoryId: string) => Promise<void>;
  };
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(
    actions.createCategory,
    {}
  );

  useEffect(() => {
    if (state.success) router.refresh();
  }, [state, router]);

  return (
    <section className="relative overflow-hidden rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-pine/[0.06] blur-2xl"
      />
      <div className="relative flex items-center gap-2">
        <TagIcon className="h-4 w-4 text-muted" />
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Categories
        </h2>
      </div>
      <p className="mt-2 text-xs text-muted">
        Group products so shoppers can browse by category.
      </p>

      <div className="mt-4">
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input
            name="name"
            placeholder="e.g. Dresses, Accessories"
            maxLength={60}
            className="min-w-0 flex-1 rounded-lg border border-charcoal/15 px-3 py-2 text-sm text-charcoal transition duration-150 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
          />
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-pine px-4 py-2 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark disabled:opacity-60"
          >
            {pending ? "Adding…" : "Add category"}
          </button>
        </form>
        {state.error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {state.error}
          </p>
        )}
      </div>

      {categories.length > 0 && (
        <ul className="mt-4 divide-y divide-charcoal/10">
          {categories.map((category) => (
            <li
              key={category.id}
              className="flex items-center justify-between py-2.5 text-sm"
            >
              <span className="font-medium text-charcoal">{category.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-muted">
                  {category.product_count}{" "}
                  {category.product_count === 1 ? "product" : "products"}
                </span>
                <form action={actions.deleteCategory.bind(null, category.id)}>
                  <button
                    type="submit"
                    className="text-muted transition duration-150 hover:text-red-600"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

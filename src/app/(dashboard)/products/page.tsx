import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusIcon } from "@heroicons/react/24/outline";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/plans";
import { getProductCategories } from "@/lib/storefront";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/types";
import { archiveProduct, createCategory, deleteCategory } from "./actions";
import { CategoryManager } from "./category-manager";

export default async function ProductsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, product_categories(name)")
    .eq("tenant_id", tenant.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false });
  const products = (data as unknown as (Product & {
    product_categories: { name: string } | null;
  })[]) ?? [];

  const categories = await getProductCategories(tenant.id);

  const plan = PLANS[tenant.subscription_tier];
  const limit = plan.productLimit;
  const used = products.length;
  const capLabel = limit === null ? `${used} products` : `${used} / ${limit} products`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold text-charcoal">
            Products
          </h1>
          <p className="mt-2 text-sm text-muted">
            {capLabel} on your {plan.name} plan
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/products/import"
            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:-translate-y-px hover:shadow-sm"
          >
            Import CSV
          </Link>
          <Link
            href="/products/export"
            className="inline-flex items-center gap-1.5 rounded-lg border border-charcoal/15 bg-white px-4 py-2.5 text-sm font-semibold text-charcoal transition duration-150 hover:-translate-y-px hover:shadow-sm"
          >
            Export CSV
          </Link>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark"
          >
            <PlusIcon className="h-4 w-4" /> New product
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-charcoal/20 bg-white p-16 text-center shadow-sm">
          <p className="text-sm text-muted">
            No products yet. Add your first product to start selling.
          </p>
          <Link
            href="/products/new"
            className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-pine px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-pine/25 transition duration-150 hover:-translate-y-px hover:bg-pine-dark"
          >
            <PlusIcon className="h-4 w-4" /> Add your first product
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-charcoal/10 overflow-hidden rounded-xl border border-white/70 bg-white shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
          {products.map((product) => (
            <li key={product.id} className="flex items-center gap-5 p-5">
              {product.images?.[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-16 w-16 shrink-0 rounded-xl bg-cream object-cover"
                />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-cream text-base font-medium text-muted">
                  {product.name.slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium text-charcoal">
                    {product.name}
                  </p>
                  {product.status === "draft" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      draft
                    </span>
                  )}
                  {product.featured && (
                    <span className="rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-white">
                      featured
                    </span>
                  )}
                  {product.product_categories?.name && (
                    <span className="rounded-full bg-cream px-2 py-0.5 text-xs font-medium text-charcoal-soft">
                      {product.product_categories.name}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted">
                  {formatMoney(product.price_minor, product.currency)} ·{" "}
                  {product.stock} in stock
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/products/${product.id}/edit`}
                  className="text-sm font-semibold text-pine underline-offset-4 hover:underline"
                >
                  Edit
                </Link>
                <form action={archiveProduct.bind(null, product.id)}>
                  <button
                    type="submit"
                    className="text-sm text-muted transition duration-150 hover:text-red-600"
                  >
                    Archive
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <CategoryManager categories={categories} actions={{ createCategory, deleteCategory }} />
    </div>
  );
}

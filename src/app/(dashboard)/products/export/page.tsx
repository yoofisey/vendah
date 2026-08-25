import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { exportProducts } from "./actions";
import { ExportButton } from "./export-button";

export default async function ExportProductsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

  const { count } = await exportProducts();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/products"
          className="text-sm font-medium text-pine underline-offset-4 hover:underline"
        >
          &larr; Back to products
        </Link>
        <h1 className="mt-3 font-heading text-3xl font-semibold text-charcoal">
          Export products
        </h1>
        <p className="mt-2 text-sm text-muted">
          Download all {count} {count === 1 ? "product" : "products"} as a CSV file.
        </p>
      </div>

      <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          CSV columns
        </h2>
        <p className="mt-2 text-sm text-muted">
          The exported CSV will include the following columns:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-charcoal-soft">
          <li><span className="font-mono font-semibold text-charcoal">name</span></li>
          <li><span className="font-mono font-semibold text-charcoal">price</span></li>
          <li><span className="font-mono font-semibold text-charcoal">stock</span></li>
          <li><span className="font-mono font-semibold text-charcoal">description</span></li>
          <li><span className="font-mono font-semibold text-charcoal">category</span></li>
          <li><span className="font-mono font-semibold text-charcoal">sku</span></li>
          <li><span className="font-mono font-semibold text-charcoal">weight_grams</span></li>
          <li><span className="font-mono font-semibold text-charcoal">status</span></li>
          <li><span className="font-mono font-semibold text-charcoal">featured</span></li>
        </ul>
        <div className="mt-6">
          <ExportButton />
        </div>
      </section>
    </div>
  );
}

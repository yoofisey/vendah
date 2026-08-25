import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentTenant, requireUser } from "@/lib/auth";
import { ImportForm } from "./import-form";

export default async function ImportProductsPage() {
  await requireUser();
  const tenant = await getCurrentTenant();
  if (!tenant) redirect("/onboarding");
  if (tenant.status !== "active") redirect("/onboarding");

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
          Import products from CSV
        </h1>
        <p className="mt-2 text-sm text-muted">
          Upload a CSV file to add multiple products at once. All imported
          products will be created as drafts.
        </p>
      </div>

      <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          CSV format
        </h2>
        <p className="mt-2 text-sm text-muted">
          Your CSV should include the following columns:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-charcoal-soft">
          <li>
            <span className="font-mono font-semibold text-charcoal">name</span>{" "}
            — required
          </li>
          <li>
            <span className="font-mono font-semibold text-charcoal">
              description
            </span>{" "}
            — optional
          </li>
          <li>
            <span className="font-mono font-semibold text-charcoal">price</span>{" "}
            — required, in your currency (e.g. 150.00)
          </li>
          <li>
            <span className="font-mono font-semibold text-charcoal">stock</span>{" "}
            — optional, defaults to 0
          </li>
          <li>
            <span className="font-mono font-semibold text-charcoal">
              category
            </span>{" "}
            — optional, ignored for now
          </li>
        </ul>
        <div className="mt-4 rounded-lg bg-cream p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted">
            Example CSV
          </p>
          <pre className="overflow-x-auto font-mono text-xs text-charcoal">
{`name,description,price,stock,category
African Print Dress,Beautiful kente-inspired print,150.00,25,Fashion
Leather Sandals,Handmade genuine leather,80.00,40,Accessories
Woven Basket,Traditional hand-woven basket,45.00,15,Home`}
          </pre>
        </div>
      </section>

      <section className="rounded-xl border border-white/70 bg-white p-7 shadow-[0_16px_40px_-24px_rgba(27,67,50,0.35)]">
        <h2 className="font-heading text-lg font-semibold text-charcoal">
          Upload file
        </h2>
        <div className="mt-4">
          <ImportForm />
        </div>
      </section>
    </div>
  );
}

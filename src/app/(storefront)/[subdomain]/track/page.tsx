import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/storefront";
import { TrackOrderForm } from "./track-order-form";

export const dynamic = "force-dynamic";

export default async function TrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{ ref?: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const { ref } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        Track your order
      </h1>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
        Enter your order reference and the phone number or email you used at
        checkout to see where your order is.
      </p>
      <div className="mt-8 rounded-2xl border border-charcoal/10 bg-white p-6 shadow-sm sm:p-8">
        <TrackOrderForm
          tenantId={tenant.id}
          initialRef={typeof ref === "string" ? ref : null}
        />
      </div>
    </div>
  );
}

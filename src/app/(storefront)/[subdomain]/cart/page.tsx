import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/storefront";
import { CartView } from "@/components/cart/cart-view";

export default async function CartPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        Your cart
      </h1>
      <CartView tenantId={tenant.id} deliveryFeeMinor={tenant.delivery_fee_minor ?? 0} shopName={tenant.name} />
    </div>
  );
}

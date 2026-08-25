import { notFound } from "next/navigation";
import { getTenantBySubdomain } from "@/lib/storefront";
import { CheckoutForm, type SavedAddress } from "@/components/checkout/checkout-form";
import { getActiveTaxRates } from "@/lib/tax";
import { getActiveShippingZones } from "@/lib/shipping";
import { getCustomerAddresses } from "@/lib/addresses";
import { createClient } from "@/lib/supabase/server";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [taxRates, shippingZones, savedAddresses] = await Promise.all([
    getActiveTaxRates(tenant.id),
    getActiveShippingZones(tenant.id),
    user?.email
      ? getCustomerAddresses(tenant.id, user.email)
      : Promise.resolve([]),
  ]);

  const addresses: SavedAddress[] = savedAddresses.map((row) => ({
    id: row.id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone ?? "",
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? "",
    city: row.city,
    region: row.region ?? "",
    isDefault: row.is_default,
  }));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-muted">
        Ordering from {tenant.name}
      </p>
      <CheckoutForm
        tenantId={tenant.id}
        deliveryFeeMinor={tenant.delivery_fee_minor ?? 0}
        taxRates={taxRates}
        shippingZones={shippingZones}
        savedAddresses={addresses}
      />
    </div>
  );
}

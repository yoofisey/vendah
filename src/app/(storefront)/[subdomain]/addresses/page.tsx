import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerAddresses } from "@/lib/addresses";
import { getTenantBySubdomain } from "@/lib/storefront";
import { resolveStorefrontHref } from "@/lib/storefront-href";
import { createClient } from "@/lib/supabase/server";
import { AddressBook, type AddressRow } from "./address-form";

export const dynamic = "force-dynamic";

export default async function AddressesPage({
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

  if (!user?.email) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <h1 className="text-center font-heading text-3xl font-semibold text-charcoal">
          My addresses
        </h1>
        <p className="mt-3 text-center text-sm text-muted">
          Sign in or create an account to save delivery addresses for faster
          checkout.
        </p>
        <div className="mt-8 text-center">
          <Link
            href={resolveStorefrontHref(subdomain, "/account")}
            className="inline-block rounded-lg bg-pine px-6 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-pine-dark"
          >
            Sign in or create an account
          </Link>
        </div>
      </div>
    );
  }

  const rows = await getCustomerAddresses(tenant.id, user.email);
  const addresses: AddressRow[] = rows.map((row) => ({
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
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        My addresses
      </h1>
      <p className="mt-2 text-sm text-muted">
        Save delivery addresses for faster checkout at {tenant.name}.
      </p>
      <div className="mt-8">
        <AddressBook
          subdomain={subdomain}
          addresses={addresses}
          defaultFullName={
            (user.user_metadata?.full_name as string | undefined) ?? ""
          }
        />
      </div>
    </div>
  );
}

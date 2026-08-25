import { notFound } from "next/navigation";
import { getStorefrontProducts, getTenantBySubdomain } from "@/lib/storefront";
import { getServerWishlist } from "@/lib/wishlist-server";
import { createClient } from "@/lib/supabase/server";
import { WishlistGrid } from "./wishlist-grid";

export const dynamic = "force-dynamic";

export default async function WishlistPage({
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

  const [products, serverIds] = await Promise.all([
    getStorefrontProducts(tenant.id),
    user?.email
      ? getServerWishlist(tenant.id, user.email)
      : Promise.resolve(undefined),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-semibold text-charcoal">
        My wishlist
      </h1>
      <p className="mt-2 text-sm text-muted">
        Items you&apos;ve saved — tap the heart on any product to add or remove
        it.
      </p>
      <div className="mt-8">
        <WishlistGrid
          products={products}
          tenantId={tenant.id}
          serverIds={serverIds}
        />
      </div>
    </div>
  );
}

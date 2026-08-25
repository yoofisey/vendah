import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type WishlistToggleResult = "added" | "removed" | null;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getServerWishlist(
  tenantId: string,
  customerEmail: string
): Promise<string[]> {
  if (!UUID_PATTERN.test(tenantId)) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("customer_wishlists")
    .select("product_id")
    .eq("tenant_id", tenantId)
    .eq("customer_email", normalizeEmail(customerEmail))
    .order("created_at", { ascending: true });
  return (data ?? []).map((row) => row.product_id as string);
}

export async function toggleServerWishlist(
  tenantId: string,
  customerEmail: string,
  productId: string
): Promise<WishlistToggleResult> {
  if (!UUID_PATTERN.test(tenantId) || !UUID_PATTERN.test(productId)) return null;
  const admin = createAdminClient();
  const email = normalizeEmail(customerEmail);

  const { data: existing } = await admin
    .from("customer_wishlists")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("customer_email", email)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await admin.from("customer_wishlists").delete().eq("id", existing.id);
    return "removed";
  }

  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!product) return null;

  const { error } = await admin.from("customer_wishlists").insert({
    tenant_id: tenantId,
    customer_email: email,
    product_id: productId,
  });
  if (error) return null;
  return "added";
}

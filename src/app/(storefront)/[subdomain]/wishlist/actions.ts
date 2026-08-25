"use server";

import { getUser } from "@/lib/auth";
import {
  getServerWishlist,
  toggleServerWishlist,
} from "@/lib/wishlist-server";

export type WishlistSyncResult = { email: string | null; ids: string[] };

export async function syncWishlist(
  tenantId: string,
  localIds: string[]
): Promise<WishlistSyncResult> {
  const user = await getUser();
  if (!user?.email) return { email: null, ids: localIds };
  const email = user.email;

  const serverIds = await getServerWishlist(tenantId, email);
  const serverSet = new Set(serverIds);
  const missing = localIds.filter((id) => !serverSet.has(id));

  for (const id of missing) {
    await toggleServerWishlist(tenantId, email, id);
  }

  const merged =
    missing.length > 0 ? await getServerWishlist(tenantId, email) : serverIds;
  return { email, ids: merged };
}

export async function toggleWishlistOnServer(
  tenantId: string,
  productId: string
): Promise<void> {
  const user = await getUser();
  if (!user?.email) return;
  await toggleServerWishlist(tenantId, user.email, productId);
}

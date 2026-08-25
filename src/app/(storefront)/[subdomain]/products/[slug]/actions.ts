"use server";

import { subscribeBackInStock } from "@/lib/back-in-stock";

export type BackInStockState = {
  ok: boolean;
  error?: string;
  initialized: boolean;
};

export async function subscribeBackInStockAction(
  _prev: BackInStockState,
  formData: FormData
): Promise<BackInStockState> {
  const tenantId = String(formData.get("tenantId") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!tenantId || !productId || !email || !email.includes("@")) {
    return { ok: false, error: "Please enter a valid email.", initialized: true };
  }

  const result = await subscribeBackInStock(tenantId, productId, email);
  return { ...result, initialized: true };
}

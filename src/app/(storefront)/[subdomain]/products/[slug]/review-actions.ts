"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  tenantId: z.string().uuid(),
  productId: z.string().uuid(),
  customerName: z.string().min(2).max(80),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(1000),
});

export type ReviewState = { error?: string; success?: boolean };

export async function submitReview(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const parsed = schema.safeParse({
    tenantId: String(formData.get("tenantId") ?? ""),
    productId: String(formData.get("productId") ?? ""),
    customerName: String(formData.get("customerName") ?? "").trim(),
    rating: Number(formData.get("rating") ?? 0),
    comment: String(formData.get("comment") ?? "").trim(),
  });
  if (!parsed.success) {
    return { error: "Please add your name, a star rating and a short review." };
  }

  const admin = createAdminClient();
  const { data: product } = await admin
    .from("products")
    .select("id")
    .eq("id", parsed.data.productId)
    .eq("tenant_id", parsed.data.tenantId)
    .maybeSingle();
  if (!product) return { error: "This product no longer exists." };

  const { error } = await admin.from("product_reviews").insert({
    product_id: parsed.data.productId,
    tenant_id: parsed.data.tenantId,
    customer_name: parsed.data.customerName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });
  if (error) return { error: error.message };
  return { success: true };
}

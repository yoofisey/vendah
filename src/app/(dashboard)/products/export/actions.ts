"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product } from "@/lib/types";

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export type ExportResult = {
  csv: string;
  count: number;
};

export async function exportProducts(): Promise<ExportResult> {
  const user = await requireUser();
  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!tenant) return { csv: "", count: 0 };

  const { data } = await admin
    .from("products")
    .select("*")
    .eq("tenant_id", tenant.id)
    .neq("status", "archived")
    .order("created_at", { ascending: false });

  const products = (data as Product[]) ?? [];
  const header = [
    "name",
    "price",
    "stock",
    "description",
    "category",
    "sku",
    "weight_grams",
    "status",
    "featured",
  ].join(",");

  const rows = products.map((p) =>
    [
      escapeCsvField(p.name),
      escapeCsvField(p.price_minor / 100),
      escapeCsvField(p.stock),
      escapeCsvField(p.description),
      escapeCsvField(p.category_id),
      escapeCsvField(p.sku),
      escapeCsvField(p.weight_grams),
      escapeCsvField(p.status),
      escapeCsvField(p.featured ? "true" : "false"),
    ].join(",")
  );

  return { csv: [header, ...rows].join("\n"), count: products.length };
}

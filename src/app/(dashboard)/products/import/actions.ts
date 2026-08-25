"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/tenant";

type ImportError = { row: number; message: string };

type ImportResult = {
  success: boolean;
  imported?: number;
  errors?: ImportError[];
  error?: string;
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        cells.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  cells.push(current.trim());
  return cells;
}

export async function importProducts(formData: FormData): Promise<ImportResult> {
  const user = await requireUser();

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided." };
  }

  const text = await file.text();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 2) {
    return { success: false, error: "CSV must have a header row and at least one data row." };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const nameIdx = header.indexOf("name");
  const descIdx = header.indexOf("description");
  const priceIdx = header.indexOf("price");
  const stockIdx = header.indexOf("stock");
  const categoryIdx = header.indexOf("category");

  if (nameIdx === -1 || priceIdx === -1) {
    return {
      success: false,
      error: "CSV must have at least 'name' and 'price' columns.",
    };
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, status, subscription_tier")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!tenant || tenant.status !== "active") {
    return { success: false, error: "Finish setting up your shop first." };
  }

  const { data: categories } = await admin
    .from("categories")
    .select("id, name")
    .eq("tenant_id", tenant.id);

  const categoryMap = new Map(
    (categories ?? []).map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id])
  );

  const rows: {
    tenant_id: string;
    name: string;
    slug: string;
    description: string;
    price_minor: number;
    stock: number;
    status: string;
    category_id: string | null;
    images: string[];
    attributes: Record<string, string>;
  }[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const rowNum = i + 1;

    const name = cells[nameIdx] ?? "";
    if (!name) {
      errors.push({ row: rowNum, message: "Name is required." });
      continue;
    }

    const price = parseFloat(cells[priceIdx] ?? "");
    if (isNaN(price) || price <= 0) {
      errors.push({ row: rowNum, message: "Price must be greater than 0." });
      continue;
    }

    const stockRaw = cells[stockIdx];
    const stock = stockRaw ? parseInt(stockRaw, 10) : 0;
    if (isNaN(stock) || stock < 0) {
      errors.push({ row: rowNum, message: "Stock must be 0 or more." });
      continue;
    }

    const description = cells[descIdx] ?? "";
    const categoryName = categoryIdx >= 0 ? (cells[categoryIdx] ?? "").toLowerCase() : "";
    const categoryId = categoryName ? categoryMap.get(categoryName) ?? null : null;

    rows.push({
      tenant_id: tenant.id,
      name,
      slug: slugify(name),
      description,
      price_minor: Math.round(price * 100),
      stock,
      status: "draft",
      category_id: categoryId,
      images: [],
      attributes: {},
    });
  }

  if (rows.length === 0) {
    return { success: false, errors, error: "No valid rows to import." };
  }

  const { error } = await admin.from("products").insert(rows);
  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, imported: rows.length, errors };
}

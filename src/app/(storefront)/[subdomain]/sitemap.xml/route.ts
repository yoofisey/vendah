import { createClient } from "@/lib/supabase/server";
import { getTenantBySubdomain } from "@/lib/storefront";
import { getStorefrontUrl } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const STATIC_PAGES: { path: string; priority: number }[] = [
  { path: "", priority: 1 },
  { path: "/shop", priority: 0.9 },
  { path: "/about", priority: 0.6 },
  { path: "/faq", priority: 0.5 },
  { path: "/contact", priority: 0.5 },
  { path: "/delivery", priority: 0.5 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(
  url: string,
  priority?: number,
  lastModified?: string
): string {
  return `<url><loc>${escapeXml(url)}</loc>${lastModified ? `<lastmod>${escapeXml(lastModified)}</lastmod>` : ""}${priority !== undefined ? `<priority>${priority}</priority>` : ""}</url>`;
}

function xmlResponse(body: string): Response {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}</urlset>\n`,
    { headers: { "content-type": "application/xml" } }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
): Promise<Response> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return xmlResponse("");

  const base = getStorefrontUrl(subdomain);
  const supabase = await createClient();

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("slug, updated_at")
      .eq("tenant_id", tenant.id)
      .eq("status", "active"),
    supabase
      .from("product_categories")
      .select("slug, updated_at")
      .eq("tenant_id", tenant.id),
  ]);

  const entries = [
    ...STATIC_PAGES.map((page) => urlEntry(`${base}${page.path}`, page.priority)),
    ...(categories ?? []).map((category) =>
      urlEntry(
        `${base}/category/${category.slug}`,
        0.6,
        category.updated_at
      )
    ),
    ...(products ?? []).map((product) =>
      urlEntry(
        `${base}/products/${product.slug}`,
        0.8,
        product.updated_at
      )
    ),
  ];

  return xmlResponse(entries.join("\n"));
}
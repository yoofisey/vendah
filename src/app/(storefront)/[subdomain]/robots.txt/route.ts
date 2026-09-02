import { getTenantBySubdomain } from "@/lib/storefront";
import { getStorefrontUrl } from "@/lib/tenant";

export const dynamic = "force-dynamic";

const DISALLOWED = [
  "/cart",
  "/checkout",
  "/account",
  "/addresses",
  "/track",
  "/wishlist",
  "/search",
  "/api",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ subdomain: string }> }
): Promise<Response> {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);

  const lines = ["User-Agent: *", "Allow: /"];
  if (tenant) {
    lines.push(...DISALLOWED.map((path) => `Disallow: ${path}`));
    lines.push("", `Sitemap: ${getStorefrontUrl(subdomain)}/sitemap.xml`);
  }

  return new Response(`${lines.join("\n")}\n`, {
    headers: { "content-type": "text/plain" },
  });
}
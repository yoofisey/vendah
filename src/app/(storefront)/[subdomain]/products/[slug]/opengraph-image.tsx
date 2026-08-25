import { ImageResponse } from "next/og";
import { getStorefrontUrl } from "@/lib/tenant";
import { getTenantBySubdomain, getProductBySlug } from "@/lib/storefront";

export const runtime = "edge";

export default async function OGImage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return new Response("Not found", { status: 404 });

  const product = await getProductBySlug(tenant.id, slug);
  if (!product) return new Response("Not found", { status: 404 });

  const price = `GH\u20B5${(product.price_minor / 100).toFixed(2)}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          background: "#fdf8f0",
          padding: "60px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontSize: "24px", color: "#1b4332", margin: 0, fontWeight: 600 }}>
            {tenant.name}
          </p>
          <h1 style={{ fontSize: "48px", color: "#1c1c1e", margin: 0, fontWeight: 700, lineHeight: 1.2 }}>
            {product.name}
          </h1>
          <p style={{ fontSize: "36px", color: "#d4a017", margin: 0, fontWeight: 700 }}>
            {price}
          </p>
          {product.description && (
            <p style={{ fontSize: "20px", color: "#666", margin: 0, lineHeight: 1.4, maxWidth: "800px" }}>
              {product.description.slice(0, 120)}
            </p>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

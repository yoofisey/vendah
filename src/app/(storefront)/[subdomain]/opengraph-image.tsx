import { ImageResponse } from "next/og";
import { getTenantBySubdomain } from "@/lib/storefront";

export const runtime = "edge";

export default async function OGImage({
  params,
}: {
  params: Promise<{ subdomain: string }>;
}) {
  const { subdomain } = await params;
  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return new Response("Not found", { status: 404 });

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "linear-gradient(135deg, #1b4332 0%, #2d6a4f 50%, #40916c 100%)",
          padding: "80px",
          textAlign: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
          <h1 style={{ fontSize: "64px", color: "#ffffff", margin: 0, fontWeight: 700, lineHeight: 1.1 }}>
            {tenant.name}
          </h1>
          {tenant.about_text && (
            <p style={{ fontSize: "28px", color: "#d4a017", margin: 0, fontWeight: 500, maxWidth: "800px", lineHeight: 1.4 }}>
              {tenant.about_text.slice(0, 100)}
            </p>
          )}
          <p style={{ fontSize: "22px", color: "rgba(255,255,255,0.7)", margin: 0, fontWeight: 400 }}>
            Shop now at {subdomain}.venfii.com
          </p>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

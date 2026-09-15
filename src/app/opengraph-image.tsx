import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "venfii — sell smarter with your own online shop";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #142f23 0%, #1b4332 45%, #2d6a4f 100%)",
          padding: "88px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span
            style={{
              display: "flex",
              width: "60px",
              height: "60px",
              borderRadius: "16px",
              backgroundColor: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                backgroundColor: "#d4a017",
              }}
            />
          </span>
          <span
            style={{
              fontSize: "40px",
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            venfii<span style={{ color: "#d4a017" }}>.</span>
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "940px",
          }}
        >
          <p
            style={{
              fontSize: "26px",
              margin: "0 0 20px 0",
              color: "#d4a017",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            Multi-tenant e-commerce for Ghana
          </p>
          <p
            style={{
              fontSize: "84px",
              lineHeight: 1.02,
              margin: 0,
              color: "#ffffff",
              fontWeight: 700,
              letterSpacing: "-0.025em",
            }}
          >
            Sell smarter with your
            <br />
            <span style={{ color: "#d4a017" }}>own online shop</span>
          </p>
          <p
            style={{
              fontSize: "30px",
              margin: "32px 0 0 0",
              color: "rgba(255,255,255,0.78)",
              fontWeight: 400,
              lineHeight: 1.35,
              maxWidth: "820px",
            }}
          >
            Accept card &amp; mobile money. Manage orders, products and
            customers — all from one dashboard.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              borderRadius: "999px",
              backgroundColor: "#d4a017",
              padding: "20px 40px",
              fontSize: "26px",
              fontWeight: 600,
              color: "#1c1c1e",
            }}
          >
            Open your shop — it&apos;s free
          </span>
          <span
            style={{
              fontSize: "24px",
              color: "rgba(255,255,255,0.65)",
              fontWeight: 400,
            }}
          >
            yourname.venfii.com
          </span>
        </div>
      </div>
    ),
    size
  );
}
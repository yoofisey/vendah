import type { MetadataRoute } from "next";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "vendah.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/sign-in",
        "/sign-up",
        "/reset-password",
        "/api",
      ],
    },
    sitemap: `https://${APP_DOMAIN}/sitemap.xml`,
  };
}
import type { MetadataRoute } from "next";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "venfii.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `https://${APP_DOMAIN}`,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
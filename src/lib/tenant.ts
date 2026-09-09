export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function normalizeSubdomain(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isValidSubdomain(subdomain: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain);
}

export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "app",
  "admin",
  "api",
  "dashboard",
  "login",
  "signup",
  "onboarding",
  "account",
  "docs",
  "help",
  "mail",
  "support",
  "status",
  "venfii",
  "platform",
  "store",
  "shop",
]);

function getAppDomain(): string {
  return process.env.NEXT_PUBLIC_APP_DOMAIN ?? "venfii.com";
}

function getAppOrigin(): string {
  const site = process.env.NEXT_PUBLIC_SITE_URL;
  if (site) return site.replace(/\/+$/, "");
  const domain = getAppDomain();
  return domain === "localhost" ? "http://localhost:3000" : `https://${domain}`;
}

export function getStorefrontUrl(subdomain: string): string {
  if (process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED === "true") {
    return `${getAppOrigin()}/${subdomain}`;
  }
  return `https://${subdomain}.${getAppDomain()}`;
}

export function getDashboardUrl(path = ""): string {
  const origin = getAppOrigin();
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

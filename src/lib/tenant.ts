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

export function getStorefrontUrl(subdomain: string): string {
  return `https://${subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "venfii.com"}`;
}

export function getDashboardUrl(path = ""): string {
  const origin = `https://${process.env.NEXT_PUBLIC_APP_DOMAIN ?? "venfii.com"}`;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}

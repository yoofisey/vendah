export function isPathBasedStorefront(): boolean {
  return process.env.NEXT_PUBLIC_STOREFRONT_PATH_BASED === "true";
}

export function resolveStorefrontHref(
  subdomain: string | null | undefined,
  href: string
): string {
  if (!subdomain || !isPathBasedStorefront()) return href;
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  if (href.startsWith("#")) return href;
  if (/^[a-z]+:/i.test(href)) return href;
  if (href.startsWith("/api/")) return href;
  if (href === "/") return `/${subdomain}`;
  if (href === `/${subdomain}` || href.startsWith(`/${subdomain}/`)) return href;
  return `/${subdomain}${href}`;
}
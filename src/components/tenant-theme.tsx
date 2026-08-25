import type { TenantBranding } from "@/lib/types";

const DEFAULT_THEME = {
  primaryColor: "#1b4332",
  accentColor: "#d4a017",
};

export function tenantThemeVars(
  branding: TenantBranding | null | undefined,
  fallbackPalette?: { primary: string; accent: string }
) {
  const primary =
    branding?.primaryColor ||
    fallbackPalette?.primary ||
    DEFAULT_THEME.primaryColor;
  const accent =
    branding?.accentColor ||
    fallbackPalette?.accent ||
    DEFAULT_THEME.accentColor;
  return {
    "--brand-primary": primary,
    "--brand-accent": accent,
  } as React.CSSProperties;
}

export function TenantTheme({
  branding,
  fallbackPalette,
}: {
  branding: TenantBranding | null | undefined;
  fallbackPalette?: { primary: string; accent: string };
}) {
  const vars = tenantThemeVars(branding, fallbackPalette);
  const css = `:root { ${Object.entries(vars)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ")} }`;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}

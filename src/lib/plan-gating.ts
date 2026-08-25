const FEATURE_GATING: Record<string, string[]> = {
  "products:basic": ["free", "starter", "growth", "industry"],
  "products:50": ["starter", "growth", "industry"],
  "products:500": ["growth", "industry"],
  "products:unlimited": ["industry"],
  "orders": ["free", "starter", "growth", "industry"],
  "discounts": ["free", "starter", "growth", "industry"],
  "analytics:30d": ["free", "starter", "growth", "industry"],
  "analytics:daterange": ["starter", "growth", "industry"],
  "analytics:advanced": ["growth", "industry"],
  "cart-recovery": ["starter", "growth", "industry"],
  "email-campaigns": ["starter", "growth", "industry"],
  "staff": ["starter", "growth", "industry"],
  "bulk-import-export": ["growth", "industry"],
  "api-access": ["industry"],
  "priority-support": ["industry"],
  "custom-domain": ["industry"],
} as const;

export type FeatureKey = keyof typeof FEATURE_GATING;

export function isFeatureEnabled(
  tier: string,
  feature: FeatureKey
): boolean {
  const allowed = FEATURE_GATING[feature];
  if (!allowed) return false;
  return allowed.includes(tier);
}

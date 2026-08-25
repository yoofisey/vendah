export type TenantBranding = {
  logoUrl?: string;
  bannerUrl?: string;
  primaryColor?: string;
  accentColor?: string;
};

export type TenantContactInfo = {
  phone?: string;
  email?: string;
  whatsapp?: string;
  businessHours?: string;
  deliveryNotes?: string;
};

export type SubscriptionTier = "free" | "starter" | "growth" | "industry";

export type BillingCycle = "monthly" | "annual";

export type Tenant = {
  id: string;
  owner_id: string | null;
  name: string;
  slug: string;
  subdomain: string | null;
  business_category_id: string;
  business_category_ids: string[];
  branding: TenantBranding;
  contact_info: TenantContactInfo;
  status: "onboarding" | "active" | "suspended";
  subscription_tier: SubscriptionTier;
  paystack_subaccount_code: string | null;
  payout_verified: boolean;
  payout_verified_name: string | null;
  announcement: string | null;
  about_text: string | null;
  delivery_fee_minor: number;
  created_at: string;
  updated_at: string;
};

export type BusinessCategory = {
  id: string;
  slug: string;
  name: string;
  available: boolean;
  sort_order: number;
};

export type PlanId = SubscriptionTier;

export type AttributeDef = {
  key: string;
  label: string;
  type: "text" | "select";
  options?: string[];
};

export type ProductVariant = {
  id: string;
  tenant_id: string;
  product_id: string;
  name: string;
  sku: string | null;
  price_override_minor: number | null;
  stock: number;
  attributes: Record<string, string>;
  sort_order: number;
  created_at: string;
};

export type Product = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  description: string | null;
  price_minor: number;
  currency: string;
  stock: number;
  sku: string | null;
  weight_grams: number | null;
  images: string[];
  image_alts: string[];
  attributes: Record<string, string>;
  category_id: string | null;
  featured: boolean;
  status: "draft" | "active" | "archived";
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  tenant_id: string;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  tenant_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

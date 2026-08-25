-- Vendah: All migrations combined
-- Run this in Supabase SQL Editor

-- ========== 0001_init.sql ==========

-- 0001_init.sql
-- Enums, business categories, and tenants

create extension if not exists "pgcrypto";

-- ==== Enums ====
DO $ BEGIN
  CREATE TYPE public.tenant_status AS ENUM ('onboarding', 'active', 'suspended')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;

DO $ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('starter', 'growth')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


-- ==== business_categories ====
-- attribute_defs drives the category-appropriate product attributes (size/colour
-- for clothing, shade for cosmetics, carat/weight for jewelry).
CREATE TABLE IF NOT EXISTS public.business_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  attribute_defs jsonb not null default '[]'::jsonb,
  available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.business_categories (slug, name, attribute_defs, sort_order, available) values
('clothing', 'Clothing', jsonb_build_array(
  jsonb_build_object('key', 'size', 'label', 'Size', 'type', 'select', 'options', jsonb_build_array('XS', 'S', 'M', 'L', 'XL', 'XXL')),
  jsonb_build_object('key', 'colour', 'label', 'Colour', 'type', 'text')
), 1, true),
('cosmetics', 'Cosmetics', jsonb_build_array(
  jsonb_build_object('key', 'shade', 'label', 'Shade', 'type', 'text'),
  jsonb_build_object('key', 'type', 'label', 'Type', 'type', 'text')
), 2, true),
('jewelry', 'Jewelry', jsonb_build_array(
  jsonb_build_object('key', 'carat', 'label', 'Carat', 'type', 'text'),
  jsonb_build_object('key', 'weight', 'label', 'Weight (g)', 'type', 'text'),
  jsonb_build_object('key', 'metal', 'label', 'Metal', 'type', 'select', 'options', jsonb_build_array('Gold', 'Silver', 'Platinum'))
), 3, true),
('groceries', 'Groceries', jsonb_build_array(), 4, false);

-- ==== tenants ====
-- One tenant per auth user (owner_id is unique).
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text not null unique,
  subdomain text unique,
  business_category_id uuid not null references public.business_categories(id),
  branding jsonb not null default '{}'::jsonb,
  contact_info jsonb not null default '{}'::jsonb,
  status public.tenant_status not null default 'onboarding',
  subscription_tier public.subscription_tier not null default 'starter',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

comment on column public.tenants.branding is 'logo_url, banner_url, primary_color, accent_color';
comment on column public.tenants.contact_info is 'phone, email, whatsapp, business_hours, delivery_notes';


-- ========== 0002_products.sql ==========

-- 0002_products.sql
-- Products are tenant-scoped with a flexible JSONB attribute schema.

DO $ BEGIN
  CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'archived')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


CREATE TABLE IF NOT EXISTS public.products (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  price_minor bigint not null check (price_minor >= 0),
  currency text not null default 'GHS',
  stock integer not null default 0 check (stock >= 0),
  images jsonb not null default '[]'::jsonb,
  attributes jsonb not null default '{}'::jsonb,
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS products_tenant_status_idx on public.products (tenant_id, status);
CREATE INDEX IF NOT EXISTS products_tenant_slug_idx on public.products (tenant_id, slug);

comment on column public.products.price_minor is 'Price in minor units (pesewas) for the currency column';
comment on column public.products.attributes is 'Category-specific attributes, e.g. {"size": "M", "colour": "Red"}';


-- ========== 0003_orders.sql ==========

-- 0003_orders.sql
-- Orders and order items. Order items snapshot name/price/attributes at purchase
-- time so catalogue edits or deletions never corrupt historical orders.

DO $ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'fulfilled', 'cancelled')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


CREATE TABLE IF NOT EXISTS public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_name text not null,
  customer_phone text,
  customer_email text,
  status public.order_status not null default 'pending',
  subtotal_minor bigint not null default 0,
  delivery_fee_minor bigint not null default 0,
  total_minor bigint not null default 0,
  currency text not null default 'GHS',
  delivery_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS orders_tenant_created_idx on public.orders (tenant_id, created_at desc);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  price_minor bigint not null check (price_minor >= 0),
  quantity integer not null check (quantity > 0),
  attributes jsonb not null default '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS order_items_order_idx on public.order_items (order_id);


-- ========== 0004_transactions_subscriptions.sql ==========

-- 0004_transactions_subscriptions.sql
-- Payment transactions (provider references, reconciliation) and subscriptions.

DO $ BEGIN
  CREATE TYPE public.payment_provider AS ENUM ('paystack', 'flutterwave', 'mobile_money')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;

DO $ BEGIN
  CREATE TYPE public.transaction_status AS ENUM ('initiated', 'pending', 'success', 'failed')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;

DO $ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'cancelled', 'paused')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;

DO $ BEGIN
  CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'annual')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  provider public.payment_provider not null,
  provider_reference text,
  amount_minor bigint not null,
  currency text not null default 'GHS',
  status public.transaction_status not null default 'initiated',
  reconciliation_status text not null default 'unmatched',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

CREATE INDEX IF NOT EXISTS transactions_tenant_created_idx on public.transactions (tenant_id, created_at desc);
CREATE INDEX IF NOT EXISTS transactions_reconciliation_idx on public.transactions (reconciliation_status);

comment on column public.transactions.reconciliation_status is 'unmatched | matched | ignored';

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  tier public.subscription_tier not null default 'starter',
  status public.subscription_status not null default 'trialing',
  billing_cycle public.billing_cycle not null default 'monthly',
  provider_subscription_id text,
  provider_customer_id text,
  product_limit integer,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.subscriptions.product_limit is 'Denormalised from tier for cheap enforcement; null = unlimited';


-- ========== 0005_rls.sql ==========

-- 0005_rls.sql
-- Row-Level Security: tenant data isolation + public storefront reads.

-- ==== Helpers ====
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Returns the tenant id owned by the current auth user, or null.
create or replace function public.current_tenant_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from public.tenants where owner_id = auth.uid()
$$;

-- ==== updated_at triggers ====
create trigger tenants_set_updated_at before update on public.tenants
  for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger transactions_set_updated_at before update on public.transactions
  for each row execute function public.set_updated_at();
create trigger subscriptions_set_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ==== Enable RLS ====
alter table public.business_categories enable row level security;
alter table public.tenants enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.transactions enable row level security;
alter table public.subscriptions enable row level security;

-- ==== business_categories: public read ====
create policy "categories_public_read" on public.business_categories
  for select using (true);

-- ==== tenants: public read (storefront resolution), owner read/write ====
create policy "tenants_public_read" on public.tenants
  for select using (status = 'active');

create policy "tenants_owner_select" on public.tenants
  for select using (owner_id = auth.uid());

create policy "tenants_owner_update" on public.tenants
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ==== products: public read active products of active tenants, owner CRUD ====
create policy "products_public_read" on public.products
  for select using (
    status = 'active'
    and exists (
      select 1 from public.tenants t
      where t.id = products.tenant_id and t.status = 'active'
    )
  );

create policy "products_owner_select" on public.products
  for select using (tenant_id = public.current_tenant_id());

create policy "products_owner_insert" on public.products
  for insert with check (tenant_id = public.current_tenant_id());

create policy "products_owner_update" on public.products
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "products_owner_delete" on public.products
  for delete using (tenant_id = public.current_tenant_id());

-- ==== orders / order_items: owner only ====
-- Customers place orders server-side (service role), so anon role has no access.
create policy "orders_owner_select" on public.orders
  for select using (tenant_id = public.current_tenant_id());

create policy "orders_owner_update" on public.orders
  for update using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "order_items_owner_select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.tenant_id = public.current_tenant_id()
    )
  );

-- ==== transactions: owner only ====
create policy "transactions_owner_select" on public.transactions
  for select using (tenant_id = public.current_tenant_id());

-- ==== subscriptions: owner only ====
create policy "subscriptions_owner_select" on public.subscriptions
  for select using (tenant_id = public.current_tenant_id());


-- ========== 0006_storage.sql ==========

-- 0006_storage.sql
-- Storage buckets for tenant branding assets and product images.
-- Folders are keyed by tenant id: tenant-assets/{tenantId}/logo, /banner

insert into storage.buckets (id, name, public)
values
  ('tenant-assets', 'tenant-assets', true),
  ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- ==== tenant-assets ====
create policy "tenant_assets_public_read" on storage.objects
  for select using (bucket_id = 'tenant-assets');

create policy "tenant_assets_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'tenant-assets'
    and exists (
      select 1 from public.tenants t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.owner_id = auth.uid()
    )
  );

create policy "tenant_assets_owner_update" on storage.objects
  for update using (
    bucket_id = 'tenant-assets'
    and exists (
      select 1 from public.tenants t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.owner_id = auth.uid()
    )
  );

create policy "tenant_assets_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'tenant-assets'
    and exists (
      select 1 from public.tenants t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.owner_id = auth.uid()
    )
  );

-- ==== product-images ====
create policy "product_images_public_read" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "product_images_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.owner_id = auth.uid()
    )
  );

create policy "product_images_owner_update" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.owner_id = auth.uid()
    )
  );

create policy "product_images_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.tenants t
      where t.id = (storage.foldername(name))[1]::uuid
        and t.owner_id = auth.uid()
    )
  );


-- ========== 0007_pricing_tiers.sql ==========

-- 0007_pricing_tiers: Free/Industry tiers, per-tier sales fee and product caps

DO $ BEGIN
  ALTER TYPE public.subscription_tier ADD VALUE 'free' BEFORE
EXCEPTION WHEN duplicate_object THEN NULL;
END $;
 'starter';
DO $ BEGIN
  ALTER TYPE public.subscription_tier ADD VALUE 'industry' AFTER
EXCEPTION WHEN duplicate_object THEN NULL;
END $;
 'growth';

alter table public.subscriptions
  add column sales_fee_pct integer not null default 0;

-- Align existing subscriptions with the new caps.
update public.subscriptions
  set product_limit = 40
  where tier = 'starter' and product_limit is distinct from 40;

update public.subscriptions
  set product_limit = 80
  where tier = 'growth' and product_limit is distinct from 80;

comment on column public.subscriptions.sales_fee_pct is
  'Platform commission on sales (percent). 6 for free tier, 0 for paid tiers. Mirrored to the Paystack subaccount split percentage.';
comment on column public.subscriptions.product_limit is
  'Product inventory cap for the tier; null = unlimited. Free=20, Starter=40, Growth=80, Industry=null.';


-- ========== 0008_checkout.sql ==========

-- 0008_checkout: Paystack subaccount per tenant and customer address on orders.

alter table public.tenants
  add column paystack_subaccount_code text;

comment on column public.tenants.paystack_subaccount_code is
  'Paystack subaccount for this vendor. Its percentage_charge mirrors subscriptions.sales_fee_pct (6 on free, 0 on paid) and drives the split on storefront charges.';

alter table public.orders
  add column customer_address text;


-- ========== 0009_billing.sql ==========

-- 0009_billing.sql: vendor subscription billing support.

alter table public.subscriptions
  add column provider_customer_email text;

comment on column public.subscriptions.provider_customer_email is
  'Paystack customer email for this vendor subscription. Used to match webhook events to tenants when metadata is not present.';


-- ========== 0010_storefront.sql ==========

-- 0010_storefront.sql
-- Storefront enhancements: tenant-scoped product categories, per-product
-- category assignment, and a "featured" flag for the storefront homepage.

CREATE TABLE IF NOT EXISTS public.product_categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

alter table public.products
  add column category_id uuid references public.product_categories(id) on delete set null,
  add column featured boolean not null default false;

CREATE INDEX IF NOT EXISTS product_categories_tenant_idx on public.product_categories (tenant_id, sort_order);
CREATE INDEX IF NOT EXISTS products_tenant_category_status_idx on public.products (tenant_id, category_id, status);
CREATE INDEX IF NOT EXISTS products_tenant_featured_status_idx on public.products (tenant_id, featured, status);

-- ==== RLS ====
alter table public.product_categories enable row level security;

create policy "product_categories_public_read" on public.product_categories
  for select using (
    exists (
      select 1 from public.tenants t
      where t.id = product_categories.tenant_id and t.status = 'active'
    )
  );

create policy "product_categories_owner_select" on public.product_categories
  for select using (tenant_id = public.current_tenant_id());

create policy "product_categories_owner_insert" on public.product_categories
  for insert with check (tenant_id = public.current_tenant_id());

create policy "product_categories_owner_delete" on public.product_categories
  for delete using (tenant_id = public.current_tenant_id());


-- ========== 0011_fulfilment.sql ==========

-- 0011_fulfilment.sql
-- Fulfilment workflow: add processing / shipped / delivered order statuses and
-- track when an order's status last changed.

-- NB: the new enum values are added but not referenced in this transaction
-- (Postgres forbids using a newly-added enum value in the same transaction).

DO $ BEGIN
  ALTER TYPE public.order_status ADD VALUE 'processing' AFTER
EXCEPTION WHEN duplicate_object THEN NULL;
END $;
 'paid';
DO $ BEGIN
  ALTER TYPE public.order_status ADD VALUE 'shipped' AFTER
EXCEPTION WHEN duplicate_object THEN NULL;
END $;
 'processing';
DO $ BEGIN
  ALTER TYPE public.order_status ADD VALUE 'delivered' AFTER
EXCEPTION WHEN duplicate_object THEN NULL;
END $;
 'shipped';

alter table public.orders
  add column status_updated_at timestamptz;


-- ========== 0012_signup_categories.sql ==========

-- Expand business categories to the full sign-up grid.
update public.business_categories set name = 'Clothing & Fashion' where slug = 'clothing';
update public.business_categories set name = 'Cosmetics & Beauty' where slug = 'cosmetics';
update public.business_categories set name = 'Jewelry & Accessories' where slug = 'jewelry';
update public.business_categories set name = 'Food & Groceries', available = true where slug = 'groceries';

insert into public.business_categories (slug, name, attribute_defs, sort_order, available) values
  ('electronics', 'Electronics', '[]'::jsonb, 5, true),
  ('home-living', 'Home & Living', '[]'::jsonb, 6, true),
  ('health-wellness', 'Health & Wellness', '[]'::jsonb, 7, true),
  ('books-stationery', 'Books & Stationery', '[]'::jsonb, 8, true),
  ('other', 'Other', '[]'::jsonb, 9, true);


-- ========== 0013_storefront_features.sql ==========

-- 0013_storefront_features.sql
-- Reviews, customer-facing order references, and homepage content fields.

CREATE TABLE IF NOT EXISTS public.product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_name text not null check (char_length(customer_name) between 2 and 80),
  rating integer not null check (rating between 1 and 5),
  comment text not null check (char_length(comment) between 3 and 1000),
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS product_reviews_product_idx on public.product_reviews (product_id, created_at desc);
CREATE INDEX IF NOT EXISTS product_reviews_tenant_idx on public.product_reviews (tenant_id);

-- Customer-facing order reference used by the "Track my order" page.
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS reference text;

update public.orders
  set reference = 'VH-' || upper(substr(md5(random()::text || id::text), 1, 8))
  where reference is null;

alter table public.orders alter column reference set not null;
create unique index orders_reference_unique on public.orders (reference);

-- Homepage content.
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS announcement text;
ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS about_text text;


-- ========== 0014_fix_storage_rls.sql ==========

-- 0014_fix_storage_rls.sql
-- Rewrite the storage owner policies to resolve the caller's tenant through
-- public.current_tenant_id() (a security-definer helper that selects the
-- tenant owned by auth.uid()). The old policies checked ownership via an
-- inline exists(...) on public.tenants, which is subject to tenants RLS
-- inside the storage policy context and rejected valid owner uploads with
-- "new row violates row-level security policy".

drop policy if exists "tenant_assets_owner_insert" on storage.objects;
drop policy if exists "tenant_assets_owner_update" on storage.objects;
drop policy if exists "tenant_assets_owner_delete" on storage.objects;
drop policy if exists "product_images_owner_insert" on storage.objects;
drop policy if exists "product_images_owner_update" on storage.objects;
drop policy if exists "product_images_owner_delete" on storage.objects;

create policy "tenant_assets_owner_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  );

create policy "tenant_assets_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  ) with check (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  );

create policy "tenant_assets_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'tenant-assets'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  );

create policy "product_images_owner_insert" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  );

create policy "product_images_owner_update" on storage.objects
  for update to authenticated using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  ) with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  );

create policy "product_images_owner_delete" on storage.objects
  for delete to authenticated using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1]::uuid = public.current_tenant_id()
  );


-- ========== 0015_delivery_fee.sql ==========

-- 0015_delivery_fee.sql
-- Merchants can set a flat delivery fee charged when customers choose delivery.
-- Stored in minor units (pesewas). 0 means free delivery.

ALTER TABLE IF EXISTS public.tenants ADD COLUMN IF NOT EXISTS delivery_fee_minor bigint not null default 0;


-- ========== 0016_multi_category.sql ==========

-- 0016_multi_category.sql
-- Allow merchants to select multiple business categories.
-- business_category_id stays as the primary (drives storefront preset);
-- business_category_ids is the full list (for attribute merging and filtering).

alter table public.tenants
  add column business_category_ids uuid[] not null default '{}'::uuid[];

update public.tenants
  set business_category_ids = ARRAY[business_category_id];


-- ========== 0017_discount_codes.sql ==========

DO $ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('percent', 'fixed')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


CREATE TABLE IF NOT EXISTS public.discount_codes (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  code         text not null,
  discount_type public.discount_type not null,
  value        bigint not null,
  min_order_minor bigint not null default 0,
  max_uses     bigint,
  used_count   bigint not null default 0,
  starts_at    timestamptz,
  expires_at   timestamptz,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique(tenant_id, code)
);

alter table public.discount_codes enable row level security;

create policy "Tenant owners manage their discount codes"
  on public.discount_codes for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_discount_codes_tenant_code on public.discount_codes(tenant_id, code);

create or replace function public.increment_discount_usage(p_tenant_id uuid, p_code text)
returns void language sql security definer as $$
  update public.discount_codes
  set used_count = used_count + 1, updated_at = now()
  where tenant_id = p_tenant_id and code = p_code;
$$;


-- ========== 0018_orders_discount.sql ==========

ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS discount_code text;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS discount_minor bigint not null default 0;


-- ========== 0019_email_campaigns.sql ==========

DO $ BEGIN
  CREATE TYPE public.campaign_status AS ENUM ('draft', 'sending', 'sent', 'failed')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references public.tenants(id) on delete cascade,
  subject         text not null,
  body            text not null,
  recipient_count bigint not null default 0,
  status          public.campaign_status not null default 'draft',
  sent_at         timestamptz,
  created_at      timestamptz not null default now()
);

alter table public.email_campaigns enable row level security;

create policy "Tenant owners manage their campaigns"
  on public.email_campaigns for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);


-- ========== 0020_homepage_sections.sql ==========

create type public.section_type as enum (
  'hero',
  'featured_products',
  'banner',
  'text',
  'image_text',
  'newsletter'
);

CREATE TABLE IF NOT EXISTS public.homepage_sections (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  section_type public.section_type not null,
  title        text,
  subtitle     text,
  body         text,
  image_url    text,
  link_url     text,
  link_label   text,
  sort_order   bigint not null default 0,
  active       boolean not null default true,
  settings     jsonb not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.homepage_sections enable row level security;

create policy "Tenant owners manage their homepage sections"
  on public.homepage_sections for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_homepage_sections_tenant_order on public.homepage_sections(tenant_id, sort_order);


-- ========== 0021_shipping_zones.sql ==========

CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  fee_minor    bigint not null default 0,
  free_above_minor bigint,
  sort_order   bigint not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.shipping_zones enable row level security;

create policy "Tenant owners manage their shipping zones"
  on public.shipping_zones for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_shipping_zones_tenant on public.shipping_zones(tenant_id, sort_order);


-- ========== 0022_tax_rates.sql ==========

CREATE TABLE IF NOT EXISTS public.tax_rates (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  name         text not null,
  rate_pct     numeric(5,2) not null default 0,
  applies_to   text not null default 'all',
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

alter table public.tax_rates enable row level security;

create policy "Tenant owners manage their tax rates"
  on public.tax_rates for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);


-- ========== 0023_staff_members.sql ==========

DO $ BEGIN
  CREATE TYPE public.staff_role AS ENUM ('owner', 'manager', 'staff')
EXCEPTION WHEN duplicate_object THEN NULL;
END $;


CREATE TABLE IF NOT EXISTS public.staff_members (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  role         public.staff_role not null default 'staff',
  invited_by   uuid references auth.users(id),
  created_at   timestamptz not null default now(),
  unique(tenant_id, user_id)
);

alter table public.staff_members enable row level security;

create policy "Tenant owners manage staff"
  on public.staff_members for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);


-- ========== 0024_back_in_stock.sql ==========

CREATE TABLE IF NOT EXISTS public.back_in_stock_notifications (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  email        text not null,
  notified     boolean not null default false,
  created_at   timestamptz not null default now(),
  unique(tenant_id, product_id, email)
);

alter table public.back_in_stock_notifications enable row level security;

create policy "Anyone can subscribe to back in stock"
  on public.back_in_stock_notifications for insert
  with check (true);

create policy "Tenant owners can view and update notifications"
  on public.back_in_stock_notifications for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_back_in_stock_pending on public.back_in_stock_notifications(tenant_id, product_id) where notified = false;


-- ========== 0025_customer_accounts.sql ==========

CREATE TABLE IF NOT EXISTS public.customer_accounts (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text,
  email        text not null,
  phone        text,
  created_at   timestamptz not null default now(),
  unique(tenant_id, user_id)
);

alter table public.customer_accounts enable row level security;

create policy "Customers manage their own account"
  on public.customer_accounts for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Tenant owners can view customer accounts"
  on public.customer_accounts for select
  using (public.current_tenant_id() = tenant_id);


-- ========== 0026_orders_enhancements.sql ==========

ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS tax_minor bigint not null default 0;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS tax_rate_name text;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS shipping_zone_id uuid references public.shipping_zones(id);
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS refund_minor bigint not null default 0;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS refund_reason text;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS refunded_at timestamptz;


-- ========== 0027_return_requests.sql ==========

CREATE TABLE IF NOT EXISTS public.return_requests (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  order_id     uuid not null references public.orders(id) on delete cascade,
  reason       text not null,
  status       text not null default 'pending',
  refund_minor bigint,
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);

alter table public.return_requests enable row level security;

create policy "Customers can create return requests"
  on public.return_requests for insert
  with check (true);

create policy "Tenant owners manage returns"
  on public.return_requests for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);


-- ========== 0028_cart_recovery.sql ==========

CREATE TABLE IF NOT EXISTS public.cart_recovery_logs (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  email        text not null,
  items_json   jsonb not null default '[]',
  total_minor  bigint not null default 0,
  recovered    boolean not null default false,
  sent_at      timestamptz not null default now(),
  recovered_at timestamptz
);

alter table public.cart_recovery_logs enable row level security;

create policy "Tenant owners manage their cart recovery logs"
  on public.cart_recovery_logs for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);


-- ========== 0029_product_variants.sql ==========

CREATE TABLE IF NOT EXISTS public.product_variants (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  product_id   uuid not null references public.products(id) on delete cascade,
  name         text not null,
  sku          text,
  price_override_minor bigint,
  stock        integer not null default 0,
  attributes   jsonb not null default '{}',
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.product_variants enable row level security;

create policy "Public read for active product variants"
  on public.product_variants for select
  using (true);

create policy "Tenant owners manage their product variants"
  on public.product_variants for all
  using (public.current_tenant_id() = tenant_id)
  with check (public.current_tenant_id() = tenant_id);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id on public.product_variants(product_id);


-- ========== 0030_product_image_alts.sql ==========

ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS image_alts jsonb not null default '[]';


-- ========== 0031_customer_addresses.sql ==========

CREATE TABLE IF NOT EXISTS public.customer_addresses (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  customer_email text not null,
  label        text not null default 'Home',
  full_name    text not null,
  phone        text,
  address_line1 text not null,
  address_line2 text,
  city         text not null,
  region       text,
  is_default   boolean not null default false,
  created_at   timestamptz not null default now()
);

alter table public.customer_addresses enable row level security;

create policy "Public read for customer addresses"
  on public.customer_addresses for select
  using (true);

create policy "Customers manage their own addresses"
  on public.customer_addresses for all
  using (true)
  with check (true);


-- ========== 0032_customer_wishlists.sql ==========

CREATE TABLE IF NOT EXISTS public.customer_wishlists (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references public.tenants(id) on delete cascade,
  customer_email text not null,
  product_id   uuid not null references public.products(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique(tenant_id, customer_email, product_id)
);

alter table public.customer_wishlists enable row level security;

create policy "Public read for wishlists"
  on public.customer_wishlists for select
  using (true);

create policy "Customers manage their own wishlists"
  on public.customer_wishlists for all
  using (true)
  with check (true);


-- ========== 0033_newsletter_subscribers.sql ==========

CREATE TABLE newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_can_subscribe" ON newsletter_subscribers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "tenant_read_subscribers" ON newsletter_subscribers
  FOR SELECT USING (tenant_id = current_tenant_id());


-- ========== 0034_product_seo_fields.sql ==========

ALTER TABLE products ADD COLUMN meta_title TEXT;
ALTER TABLE products ADD COLUMN meta_description TEXT;


-- ========== 0035_product_sku_weight.sql ==========

ALTER TABLE products ADD COLUMN sku TEXT;
ALTER TABLE products ADD COLUMN weight_grams INTEGER;


-- ========== 0036_page_views.sql ==========

CREATE TABLE page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  referrer TEXT,
  visitor_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_insert" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "tenant_read_views" ON page_views FOR SELECT USING (tenant_id = current_tenant_id());
CREATE INDEX IF NOT EXISTS idx_page_views_tenant_date ON page_views(tenant_id, created_at DESC);


-- ========== 0037_paystack_verification.sql ==========

ALTER TABLE tenants ADD COLUMN payout_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE tenants ADD COLUMN payout_verified_name TEXT;





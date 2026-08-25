-- 0001_init.sql
-- Enums, business categories, and tenants

create extension if not exists "pgcrypto";

-- ==== Enums ====
create type public.tenant_status as enum ('onboarding', 'active', 'suspended');
create type public.subscription_tier as enum ('starter', 'growth');

-- ==== business_categories ====
-- attribute_defs drives the category-appropriate product attributes (size/colour
-- for clothing, shade for cosmetics, carat/weight for jewelry).
create table public.business_categories (
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
create table public.tenants (
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

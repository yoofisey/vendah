create type public.section_type as enum (
  'hero',
  'featured_products',
  'banner',
  'text',
  'image_text',
  'newsletter'
);

create table public.homepage_sections (
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

create index idx_homepage_sections_tenant_order on public.homepage_sections(tenant_id, sort_order);

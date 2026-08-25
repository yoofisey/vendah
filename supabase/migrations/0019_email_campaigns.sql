create type public.campaign_status as enum ('draft', 'sending', 'sent', 'failed');

create table public.email_campaigns (
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

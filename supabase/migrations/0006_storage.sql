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

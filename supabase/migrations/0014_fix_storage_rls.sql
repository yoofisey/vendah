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

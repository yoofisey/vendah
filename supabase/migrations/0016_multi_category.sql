-- 0016_multi_category.sql
-- Allow merchants to select multiple business categories.
-- business_category_id stays as the primary (drives storefront preset);
-- business_category_ids is the full list (for attribute merging and filtering).

alter table public.tenants
  add column business_category_ids uuid[] not null default '{}'::uuid[];

update public.tenants
  set business_category_ids = ARRAY[business_category_id];

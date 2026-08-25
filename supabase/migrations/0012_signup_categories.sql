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

-- Run after 001_orders_and_categories.sql
-- Safe to re-run (idempotent)

alter table public.menu_items
  add column if not exists allergens text,
  add column if not exists weight_g integer;

alter table public.orders
  add column if not exists payment_method text default 'on_delivery';

create table if not exists public.tenant_settings (
  tenant_id uuid not null,
  logo_url text,
  updated_at timestamptz not null default now()
);

-- Ensure PK exists even if table was created earlier without it
do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'tenant_settings'
      and c.contype = 'p'
  ) then
    alter table public.tenant_settings
      add constraint tenant_settings_pkey primary key (tenant_id);
  end if;
exception
  when others then null;
end $$;

insert into public.tenant_settings (tenant_id)
select '3767b167-cc5f-4d4d-ae59-95e8bc6f795b'::uuid
where not exists (
  select 1
  from public.tenant_settings
  where tenant_id = '3767b167-cc5f-4d4d-ae59-95e8bc6f795b'::uuid
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.tenant_settings enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "tenant_settings_public_read" on public.tenant_settings;
create policy "tenant_settings_public_read"
  on public.tenant_settings for select
  using (true);

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

alter table public.menu_items enable row level security;

drop policy if exists "menu_items_public_read" on public.menu_items;
create policy "menu_items_public_read"
  on public.menu_items for select
  using (is_available = true);

drop policy if exists "menu_items_admin_all" on public.menu_items;
create policy "menu_items_admin_all"
  on public.menu_items for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "categories_admin_all" on public.categories;
create policy "categories_admin_all"
  on public.categories for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "tenant_settings_admin_update" on public.tenant_settings;
create policy "tenant_settings_admin_update"
  on public.tenant_settings for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- Storage bucket (avoid ON CONFLICT — not all Supabase versions expose the same unique index)
insert into storage.buckets (id, name, public)
select 'brand-assets', 'brand-assets', true
where not exists (
  select 1 from storage.buckets where id = 'brand-assets'
);

drop policy if exists "brand_assets_public_read" on storage.objects;
create policy "brand_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'brand-assets');

drop policy if exists "brand_assets_admin_insert" on storage.objects;
create policy "brand_assets_admin_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'brand-assets'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "brand_assets_admin_update" on storage.objects;
create policy "brand_assets_admin_update"
  on storage.objects for update
  using (
    bucket_id = 'brand-assets'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

drop policy if exists "brand_assets_admin_delete" on storage.objects;
create policy "brand_assets_admin_delete"
  on storage.objects for delete
  using (
    bucket_id = 'brand-assets'
    and exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

-- After creating admin user in Supabase Auth, run:
-- insert into public.profiles (id, is_admin) values ('YOUR-USER-UUID', true);

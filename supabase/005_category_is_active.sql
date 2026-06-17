-- Run in Supabase SQL Editor after previous migrations.
-- Adds visibility toggle for categories in admin panel.

alter table public.categories
  add column if not exists is_active boolean not null default true;

update public.categories
set is_active = true
where is_active is null;

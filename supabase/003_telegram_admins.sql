-- Telegram username allowlist for admin panel access
-- Run after 002_premium_features.sql

create table if not exists public.telegram_admins (
  tenant_id uuid not null,
  telegram_username text not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, telegram_username)
);

create index if not exists telegram_admins_username_idx
  on public.telegram_admins (telegram_username);

alter table public.telegram_admins enable row level security;

-- No public policies: only service role (bot API) reads/writes this table.

-- Seed yourself (replace with your Telegram @username, without @):
-- insert into public.telegram_admins (tenant_id, telegram_username)
-- select '3767b167-cc5f-4d4d-ae59-95e8bc6f795b'::uuid, 'your_username'
-- where not exists (
--   select 1 from public.telegram_admins
--   where tenant_id = '3767b167-cc5f-4d4d-ae59-95e8bc6f795b'::uuid
--     and telegram_username = 'your_username'
-- );

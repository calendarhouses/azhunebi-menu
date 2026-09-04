-- Blocked Telegram usernames (cannot use bot / menu at all).
-- Run in Supabase SQL Editor.

create table if not exists public.telegram_blocked (
  tenant_id uuid not null,
  telegram_username text not null,
  reason text,
  created_at timestamptz not null default now(),
  primary key (tenant_id, telegram_username)
);

create index if not exists telegram_blocked_username_idx
  on public.telegram_blocked (telegram_username);

alter table public.telegram_blocked enable row level security;
-- No public policies: bot service role only.

insert into public.telegram_blocked (tenant_id, telegram_username, reason)
values
  ('3767b167-cc5f-4d4d-ae59-95e8bc6f795b'::uuid, 'alisa2013', 'spam orders'),
  ('3767b167-cc5f-4d4d-ae59-95e8bc6f795b'::uuid, 'jaxxmyyhusband', 'spam orders')
on conflict (tenant_id, telegram_username) do nothing;

-- Guest menu access: only QR (cabin/table) grants ordering until house checkout revokes it.
-- Run in Supabase SQL Editor after previous migrations.

create table if not exists public.guest_menu_access (
  tenant_id uuid not null,
  telegram_user_id bigint not null,
  source text not null check (source in ('cabin', 'table')),
  cabin_number smallint check (cabin_number between 0 and 12),
  table_number smallint check (table_number between 1 and 12),
  session_id uuid references public.house_sessions (id) on delete set null,
  granted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, telegram_user_id)
);

create index if not exists guest_menu_access_session_idx
  on public.guest_menu_access (session_id)
  where session_id is not null;

alter table public.guest_menu_access enable row level security;
-- No public policies: bot service role only.

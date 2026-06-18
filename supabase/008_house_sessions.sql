-- Open house bill / running tab sessions (check-in auto on first order, check-out by admin)
-- Run after 007_order_table_number.sql

create table if not exists public.house_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  cabin_number smallint not null check (cabin_number between 1 and 12),
  status text not null default 'active' check (status in ('active', 'closed')),
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz,
  closed_at timestamptz,
  closed_total numeric(10, 2),
  final_total numeric(10, 2),
  closed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists house_sessions_active_cabin_idx
  on public.house_sessions (tenant_id, cabin_number)
  where status = 'active';

create index if not exists house_sessions_tenant_status_idx
  on public.house_sessions (tenant_id, status);

create table if not exists public.house_guest_bindings (
  tenant_id uuid not null,
  telegram_user_id bigint not null,
  cabin_number smallint not null check (cabin_number between 1 and 12),
  session_id uuid not null references public.house_sessions (id) on delete cascade,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, telegram_user_id)
);

create index if not exists house_guest_bindings_session_idx
  on public.house_guest_bindings (session_id);

alter table public.orders
  add column if not exists session_id uuid references public.house_sessions (id);

create index if not exists orders_session_id_idx
  on public.orders (session_id)
  where session_id is not null;

alter table public.house_sessions enable row level security;
alter table public.house_guest_bindings enable row level security;

-- No public policies: bot service role only.

-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  status text not null default 'pending'
    check (status in ('pending', 'preparing', 'ready', 'cancelled')),
  telegram_user_id bigint not null,
  user_first_name text,
  user_username text,
  cart jsonb not null,
  total numeric(10, 2) not null,
  comment text,
  location_note text,
  admin_message_id bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_tenant_id_idx on public.orders (tenant_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_telegram_user_id_idx on public.orders (telegram_user_id);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists categories_tenant_id_idx on public.categories (tenant_id);

-- Default categories for «Аж у небі»
insert into public.categories (tenant_id, name, sort_order)
values
  ('3767b167-cc5f-4d4d-ae59-95e8bc6f795b', 'Сніданки', 1),
  ('3767b167-cc5f-4d4d-ae59-95e8bc6f795b', 'Перші страви', 2),
  ('3767b167-cc5f-4d4d-ae59-95e8bc6f795b', 'Другі страви', 3),
  ('3767b167-cc5f-4d4d-ae59-95e8bc6f795b', 'Салати', 4)
on conflict (tenant_id, name) do nothing;

alter table public.orders enable row level security;
alter table public.categories enable row level security;

-- Public read categories for tenant (anon key from Web App)
create policy "categories_public_read"
  on public.categories for select
  using (true);

-- Orders: only service role writes (no public insert/select policies)

create or replace function public.set_orders_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_orders_updated_at();

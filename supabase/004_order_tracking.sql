-- Order tracking: 4 statuses + scheduled orders + ready timestamp
-- Run after 003_telegram_admins.sql

alter table public.orders
  add column if not exists scheduled_for timestamptz,
  add column if not exists ready_at timestamptz;

alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'accepted', 'preparing', 'ready', 'cancelled'));

create index if not exists orders_scheduled_for_idx
  on public.orders (scheduled_for)
  where scheduled_for is not null and status = 'accepted';

create index if not exists orders_ready_at_idx
  on public.orders (ready_at)
  where status = 'ready';

-- Backfill ready_at for existing ready orders
update public.orders
set ready_at = updated_at
where status = 'ready' and ready_at is null;

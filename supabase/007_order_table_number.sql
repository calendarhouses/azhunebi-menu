-- QR table orders: separate table_number from guest cabin (location_note)
alter table public.orders
  add column if not exists table_number text;

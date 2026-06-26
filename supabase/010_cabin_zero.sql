-- Allow owner house «Будиночок 0» (startapp=c0)
-- Run after 009_house_sessions_analytics.sql

alter table public.house_sessions
  drop constraint if exists house_sessions_cabin_number_check;

alter table public.house_sessions
  add constraint house_sessions_cabin_number_check
  check (cabin_number between 0 and 12);

alter table public.house_guest_bindings
  drop constraint if exists house_guest_bindings_cabin_number_check;

alter table public.house_guest_bindings
  add constraint house_guest_bindings_cabin_number_check
  check (cabin_number between 0 and 12);

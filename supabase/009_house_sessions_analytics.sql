-- Analytics columns + atomic session open (race-safe)
-- Run after 008_house_sessions.sql

alter table public.house_sessions
  add column if not exists closed_at timestamptz,
  add column if not exists final_total numeric(10, 2);

-- Backfill from legacy column names if present
update public.house_sessions
set
  closed_at = coalesce(closed_at, checked_out_at),
  final_total = coalesce(final_total, closed_total)
where status = 'closed';

create or replace function public.get_or_create_active_house_session(
  p_tenant_id uuid,
  p_cabin_number smallint
)
returns public.house_sessions
language plpgsql
as $$
declare
  result public.house_sessions;
begin
  select *
  into result
  from public.house_sessions
  where tenant_id = p_tenant_id
    and cabin_number = p_cabin_number
    and status = 'active'
  limit 1;

  if found then
    return result;
  end if;

  begin
    insert into public.house_sessions (tenant_id, cabin_number, status)
    values (p_tenant_id, p_cabin_number, 'active')
    returning * into result;

    return result;
  exception
    when unique_violation then
      select *
      into result
      from public.house_sessions
      where tenant_id = p_tenant_id
        and cabin_number = p_cabin_number
        and status = 'active'
      limit 1;

      if not found then
        raise;
      end if;

      return result;
  end;
end;
$$;

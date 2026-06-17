-- Restrict public category reads to active categories only.
-- Admin API uses service role and is unaffected.

drop policy if exists "categories_public_read" on public.categories;

create policy "categories_public_read"
  on public.categories for select
  using (is_active = true);

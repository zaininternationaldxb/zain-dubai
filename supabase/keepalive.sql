-- Tiny table used only by the daily keep-alive job (.github/workflows/keepalive.yml).
-- The job inserts one row and deletes it again, so the table stays empty.
-- Run once in the Supabase SQL editor.

create table if not exists public.keepalive (
  id uuid default gen_random_uuid() primary key,
  pinged_at timestamp with time zone not null default now()
);

alter table public.keepalive enable row level security;

drop policy if exists "keepalive_anon_all" on public.keepalive;
create policy "keepalive_anon_all"
on public.keepalive
for all
to anon
using (true)
with check (true);

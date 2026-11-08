-- Full setup for the NEW Supabase project (jcizvdbndmyybtenxemd). Run once in SQL editor.
-- 1) base schema
-- Real Estate app schema (admins allowlist + properties + leads)
-- Paste into Supabase SQL Editor and run.

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- =============
-- ADMINS TABLE
-- =============
create table if not exists public.admins (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  active boolean not null default true,
  created_at timestamp with time zone not null default now()
);

alter table public.admins enable row level security;

-- Only authenticated users can read the admins table (used by AdminGate to check allowlist)
drop policy if exists "admins_read_authenticated" on public.admins;
create policy "admins_read_authenticated"
on public.admins
for select
to authenticated
using (true);

-- Only allow existing admins to manage the admins table (so public can't add themselves)
drop policy if exists "admins_insert_admins_only" on public.admins;
create policy "admins_insert_admins_only"
on public.admins
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

drop policy if exists "admins_update_admins_only" on public.admins;
create policy "admins_update_admins_only"
on public.admins
for update
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

drop policy if exists "admins_delete_admins_only" on public.admins;
create policy "admins_delete_admins_only"
on public.admins
for delete
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

-- =================
-- PROPERTIES TABLE
-- =================
create table if not exists public.properties (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  location text not null,
  price integer not null check (price >= 0),
  beds integer not null default 0 check (beds >= 0),
  baths integer not null default 0 check (baths >= 0),
  area_sqft integer not null default 0 check (area_sqft >= 0),
  tag text,
  cover_image text not null,
  gallery text[] not null default '{}'::text[],
  description text not null,
  amenities text[] not null default '{}'::text[],
  published boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.properties
  add column if not exists listing_type text not null default 'sale',
  add column if not exists property_type text not null default 'apartment',
  add column if not exists placements text[] not null default '{"buy"}'::text[],
  add column if not exists featured boolean not null default false;

create index if not exists properties_published_idx on public.properties (published);
create index if not exists properties_created_at_idx on public.properties (created_at desc);

-- updated_at trigger
drop trigger if exists set_properties_updated_at on public.properties;
drop function if exists public.set_updated_at;
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_properties_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

alter table public.properties enable row level security;

-- Public can read ONLY published properties (for the website)
drop policy if exists "properties_public_read_published" on public.properties;
create policy "properties_public_read_published"
on public.properties
for select
using (published = true);

-- Admins can read everything (including drafts)
drop policy if exists "properties_admin_read_all" on public.properties;
create policy "properties_admin_read_all"
on public.properties
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

-- Admin-only writes
drop policy if exists "properties_admin_insert" on public.properties;
create policy "properties_admin_insert"
on public.properties
for insert
to authenticated
with check (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

drop policy if exists "properties_admin_update" on public.properties;
create policy "properties_admin_update"
on public.properties
for update
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

drop policy if exists "properties_admin_delete" on public.properties;
create policy "properties_admin_delete"
on public.properties
for delete
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

-- ============
-- LEADS TABLE
-- ============
create table if not exists public.leads (
  id uuid default gen_random_uuid() primary key,
  name text,
  phone text,
  email text,
  message text,
  source text,
  created_at timestamp with time zone not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

alter table public.leads enable row level security;

-- Only admins can read leads
drop policy if exists "leads_admin_read" on public.leads;
create policy "leads_admin_read"
on public.leads
for select
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

-- Public can submit leads (no auth required)
drop policy if exists "leads_public_insert" on public.leads;
create policy "leads_public_insert"
on public.leads
for insert
with check (true);

-- Only admins can update/delete leads (optional, but safest)
drop policy if exists "leads_admin_update" on public.leads;
create policy "leads_admin_update"
on public.leads
for update
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

drop policy if exists "leads_admin_delete" on public.leads;
create policy "leads_admin_delete"
on public.leads
for delete
to authenticated
using (
  exists (
    select 1
    from public.admins a
    where a.email = auth.jwt() ->> 'email'
      and a.active = true
  )
);

-- ============
-- SEED (OPTIONAL)
-- ============
-- After creating your first admin user in Supabase Auth, allowlist them:
-- insert into public.admins (email, active) values ('your@email.com', true);

-- 2) sync columns
-- Britix listing sync support
-- Run this in Supabase SQL editor before deploying the edge function.

alter table public.properties
  add column if not exists external_source text,
  add column if not exists external_id text,
  add column if not exists external_url text,
  add column if not exists last_synced_at timestamp with time zone,
  add column if not exists sync_payload jsonb;

drop index if exists public.properties_external_source_external_id_uidx;
create unique index if not exists properties_external_source_external_id_uidx
  on public.properties (external_source, external_id);

create index if not exists properties_external_source_idx
  on public.properties (external_source);

-- Mark listings missing from the latest Britix snapshot as unpublished.
create or replace function public.sync_mark_missing_britix_unpublished(active_external_ids text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  if active_external_ids is null or cardinality(active_external_ids) = 0 then
    update public.properties
    set
      published = false,
      updated_at = now()
    where external_source = 'britix'
      and published = true;
  else
    update public.properties
    set
      published = false,
      updated_at = now()
    where external_source = 'britix'
      and published = true
      and not (external_id = any(active_external_ids));
  end if;

  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

revoke all on function public.sync_mark_missing_britix_unpublished(text[]) from public;
grant execute on function public.sync_mark_missing_britix_unpublished(text[]) to service_role;

-- 3) international
-- International Properties Table
-- Run in Supabase SQL Editor after schema.sql is applied.
-- The set_updated_at() function must already exist (created by schema.sql).

create extension if not exists pgcrypto;

create table if not exists public.international_properties (
  id            uuid    default gen_random_uuid() primary key,
  title         text    not null,
  location      text    not null,
  country       text    not null,
  region        text    not null,  -- 'europe' | 'uk' | 'pakistan'
  price         integer not null check (price >= 0),
  currency      text    not null default 'GBP',
  beds          integer not null default 0 check (beds >= 0),
  baths         integer not null default 0 check (baths >= 0),
  area_sqft     integer not null default 0 check (area_sqft >= 0),
  tag           text,
  cover_image   text    not null default '',
  gallery       text[]  not null default '{}'::text[],
  description   text    not null default '',
  amenities     text[]  not null default '{}'::text[],
  property_type text    not null default 'apartment',
  listing_type  text    not null default 'sale',
  featured      boolean not null default false,
  published     boolean not null default true,
  created_at    timestamp with time zone not null default now(),
  updated_at    timestamp with time zone not null default now()
);

create index if not exists intl_props_region_idx     on public.international_properties (region);
create index if not exists intl_props_published_idx  on public.international_properties (published);
create index if not exists intl_props_created_at_idx on public.international_properties (created_at desc);

-- Auto-update updated_at (reuses function from schema.sql)
drop trigger if exists set_intl_properties_updated_at on public.international_properties;
create trigger set_intl_properties_updated_at
before update on public.international_properties
for each row
execute function public.set_updated_at();

alter table public.international_properties enable row level security;

-- Public can read published
drop policy if exists "intl_props_public_read" on public.international_properties;
create policy "intl_props_public_read"
on public.international_properties
for select
using (published = true);

-- Admins can read all (including drafts)
drop policy if exists "intl_props_admin_read_all" on public.international_properties;
create policy "intl_props_admin_read_all"
on public.international_properties
for select
to authenticated
using (
  exists (
    select 1 from public.admins a
    where a.email = auth.jwt() ->> 'email' and a.active = true
  )
);

drop policy if exists "intl_props_admin_insert" on public.international_properties;
create policy "intl_props_admin_insert"
on public.international_properties
for insert
to authenticated
with check (
  exists (
    select 1 from public.admins a
    where a.email = auth.jwt() ->> 'email' and a.active = true
  )
);

drop policy if exists "intl_props_admin_update" on public.international_properties;
create policy "intl_props_admin_update"
on public.international_properties
for update
to authenticated
using (
  exists (
    select 1 from public.admins a
    where a.email = auth.jwt() ->> 'email' and a.active = true
  )
);

drop policy if exists "intl_props_admin_delete" on public.international_properties;
create policy "intl_props_admin_delete"
on public.international_properties
for delete
to authenticated
using (
  exists (
    select 1 from public.admins a
    where a.email = auth.jwt() ->> 'email' and a.active = true
  )
);

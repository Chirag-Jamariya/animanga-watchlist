-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- watchlist_items: id from AniList, public readable, inserts via service role only
create table if not exists public.watchlist_items (
  id integer primary key,
  type text not null check (type in ('ANIME','MANGA')),
  title text not null,
  poster_url text not null,
  rating integer,
  genres text[] not null default '{}',
  characters text[] not null default '{}',
  description text not null,
  added_at timestamptz not null default now()
);

-- rate_limits: track IP and last add time
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  last_added timestamptz not null default now()
);

-- RLS
alter table public.watchlist_items enable row level security;
alter table public.rate_limits enable row level security;

-- Policies
-- Public can read the watchlist
drop policy if exists "public read watchlist" on public.watchlist_items;
create policy "public read watchlist"
  on public.watchlist_items
  for select
  to anon, authenticated
  using (true);

-- Inserts only allowed by service role (no explicit policy needed; service bypasses RLS)
drop policy if exists "no public insert watchlist" on public.watchlist_items;
create policy "no public insert watchlist"
  on public.watchlist_items
  for insert
  to anon, authenticated
  with check (false);

-- Updates/deletes blocked for anon/authenticated
drop policy if exists "no public update watchlist" on public.watchlist_items;
create policy "no public update watchlist"
  on public.watchlist_items
  for update
  to anon, authenticated
  using (false);

drop policy if exists "no public delete watchlist" on public.watchlist_items;
create policy "no public delete watchlist"
  on public.watchlist_items
  for delete
  to anon, authenticated
  using (false);

-- rate_limits only readable/insertable by service role
drop policy if exists "no public select rate_limits" on public.rate_limits;
create policy "no public select rate_limits"
  on public.rate_limits
  for select
  to anon, authenticated
  using (false);

drop policy if exists "no public insert rate_limits" on public.rate_limits;
create policy "no public insert rate_limits"
  on public.rate_limits
  for insert
  to anon, authenticated
  with check (false);

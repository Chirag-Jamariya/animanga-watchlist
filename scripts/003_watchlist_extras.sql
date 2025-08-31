alter table if exists public.watchlist_items
  add column if not exists user_rating integer,

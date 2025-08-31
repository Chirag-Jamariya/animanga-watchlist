-- Adds a progress column to track episode (anime) or chapter (manga).
-- Safe if run multiple times.
ALTER TABLE public.watchlist_items
  ADD COLUMN IF NOT EXISTS progress integer CHECK (progress >= 0);

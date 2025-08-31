-- Add missing totals, progress, and user rating columns to public.watchlist_items
-- Safe to run multiple times.

ALTER TABLE public.watchlist_items
  ADD COLUMN IF NOT EXISTS total_episodes integer,
  ADD COLUMN IF NOT EXISTS total_chapters integer,
  ADD COLUMN IF NOT EXISTS current_episode integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_chapter integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS user_rating integer CHECK (user_rating BETWEEN 0 AND 100);

-- Helpful indexes (optional but recommended)
CREATE INDEX IF NOT EXISTS watchlist_items_type_idx ON public.watchlist_items (type);
CREATE INDEX IF NOT EXISTS watchlist_items_added_at_idx ON public.watchlist_items (added_at);

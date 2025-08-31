ALTER TABLE IF EXISTS watchlist
  ADD COLUMN IF NOT EXISTS user_rating integer,
  ADD COLUMN IF NOT EXISTS total_episodes integer,
  ADD COLUMN IF NOT EXISTS total_chapters integer;

-- Optional: keep user_rating within 0..100 using a constraint (won't backfill existing bad rows)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_rating_range'
  ) THEN
    ALTER TABLE watchlist
      ADD CONSTRAINT user_rating_range CHECK (user_rating IS NULL OR (user_rating >= 0 AND user_rating <= 100));
  END IF;
END $$;

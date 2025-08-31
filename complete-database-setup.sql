-- Complete database setup for anime watchlist
-- Run this in Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create watchlist_items table with all required columns
CREATE TABLE IF NOT EXISTS public.watchlist_items (
  id INTEGER PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('ANIME','MANGA')),
  title TEXT NOT NULL,
  poster_url TEXT NOT NULL,
  rating INTEGER,
  genres TEXT[] NOT NULL DEFAULT '{}',
  characters TEXT[] NOT NULL DEFAULT '{}',
  description TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0),
  user_rating INTEGER CHECK (user_rating BETWEEN 0 AND 100),
  total_episodes INTEGER,
  total_chapters INTEGER
);

-- Create rate_limits table
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  last_added TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add missing columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
  -- Add progress column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='watchlist_items' AND column_name='progress') THEN
    ALTER TABLE public.watchlist_items ADD COLUMN progress INTEGER DEFAULT 0 CHECK (progress >= 0);
  END IF;
  
  -- Add user_rating column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='watchlist_items' AND column_name='user_rating') THEN
    ALTER TABLE public.watchlist_items ADD COLUMN user_rating INTEGER CHECK (user_rating BETWEEN 0 AND 100);
  END IF;
  
  -- Add total_episodes column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='watchlist_items' AND column_name='total_episodes') THEN
    ALTER TABLE public.watchlist_items ADD COLUMN total_episodes INTEGER;
  END IF;
  
  -- Add total_chapters column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='watchlist_items' AND column_name='total_chapters') THEN
    ALTER TABLE public.watchlist_items ADD COLUMN total_chapters INTEGER;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE public.watchlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "public read watchlist" ON public.watchlist_items;
DROP POLICY IF EXISTS "no public insert watchlist" ON public.watchlist_items;
DROP POLICY IF EXISTS "no public update watchlist" ON public.watchlist_items;
DROP POLICY IF EXISTS "no public delete watchlist" ON public.watchlist_items;
DROP POLICY IF EXISTS "no public select rate_limits" ON public.rate_limits;
DROP POLICY IF EXISTS "no public insert rate_limits" ON public.rate_limits;

-- Create policies for watchlist_items
CREATE POLICY "public read watchlist"
  ON public.watchlist_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "no public insert watchlist"
  ON public.watchlist_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

CREATE POLICY "no public update watchlist"
  ON public.watchlist_items
  FOR UPDATE
  TO anon, authenticated
  USING (false);

CREATE POLICY "no public delete watchlist"
  ON public.watchlist_items
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- Create policies for rate_limits
CREATE POLICY "no public select rate_limits"
  ON public.rate_limits
  FOR SELECT
  TO anon, authenticated
  USING (false);

CREATE POLICY "no public insert rate_limits"
  ON public.rate_limits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);

-- Create helpful indexes
CREATE INDEX IF NOT EXISTS watchlist_items_type_idx ON public.watchlist_items (type);
CREATE INDEX IF NOT EXISTS watchlist_items_added_at_idx ON public.watchlist_items (added_at);
CREATE INDEX IF NOT EXISTS rate_limits_ip_idx ON public.rate_limits (ip_address);

-- Grant necessary permissions to service role
GRANT ALL ON public.watchlist_items TO service_role;
GRANT ALL ON public.rate_limits TO service_role;

-- Grant read permissions to anon and authenticated users
GRANT SELECT ON public.watchlist_items TO anon, authenticated;

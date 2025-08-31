-- Test if the database tables exist and check their structure
-- Run this in Supabase SQL Editor to verify setup

-- Check if watchlist_items table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'watchlist_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if rate_limits table exists
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'rate_limits' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check current data in watchlist_items
SELECT id, type, title, progress, total_episodes, total_chapters 
FROM public.watchlist_items 
LIMIT 5;

-- Supabase Database Setup for GiveMeGuidance
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verse_text TEXT NOT NULL,
    verse_reference TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_reference ON public.bookmarks(user_id, verse_reference);
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own bookmarks
CREATE POLICY "Users can view their own bookmarks" ON public.bookmarks
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert their own bookmarks" ON public.bookmarks
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete their own bookmarks" ON public.bookmarks
    FOR DELETE
    USING (auth.uid() = user_id);

-- Unique constraint to prevent duplicate bookmarks for the same verse
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_unique_verse 
    ON public.bookmarks(user_id, verse_reference);

-- Grant permissions
GRANT ALL ON public.bookmarks TO authenticated;
GRANT SELECT ON public.bookmarks TO anon;

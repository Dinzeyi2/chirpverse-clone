
-- If post_views table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS public.post_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shoutout_id UUID REFERENCES public.shoutouts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  session_id TEXT,
  ip_address TEXT
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS idx_post_views_shoutout_id ON public.post_views(shoutout_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);

-- Enable RLS
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can insert their own views"
ON public.post_views
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can read all views"
ON public.post_views
FOR SELECT
USING (true);

-- Create a function to increment view count if it doesn't exist
CREATE OR REPLACE FUNCTION increment_view_count(row_id UUID, table_name TEXT, column_name TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE format('UPDATE %I SET %I = %I + 1 WHERE id = $1', table_name, column_name, column_name)
  USING row_id;
END;
$$;


-- Create table for comment reactions if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comment_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT comment_reactions_unique UNIQUE (comment_id, user_id, emoji)
);

-- Enable row-level security
ALTER TABLE public.comment_reactions ENABLE ROW LEVEL SECURITY;

-- Grant permissions to authenticated users
GRANT ALL ON public.comment_reactions TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE comment_reactions_id_seq TO authenticated;

-- Create policies for accessing comment reactions
CREATE POLICY "Anyone can view comment reactions" 
    ON public.comment_reactions FOR SELECT USING (true);
    
CREATE POLICY "Authenticated users can create comment reactions" 
    ON public.comment_reactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    
CREATE POLICY "Users can update their own comment reactions" 
    ON public.comment_reactions FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own comment reactions" 
    ON public.comment_reactions FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for the comment_reactions table
ALTER TABLE public.comment_reactions REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_reactions;

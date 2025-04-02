
-- Create table for storing user push notification subscriptions
CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  CONSTRAINT user_push_subscriptions_user_id_key UNIQUE (user_id)
);

-- Enable RLS on the subscriptions table
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_push_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions"
  ON public.user_push_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own subscriptions
CREATE POLICY "Users can update their own subscriptions"
  ON public.user_push_subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own subscriptions
CREATE POLICY "Users can delete their own subscriptions"
  ON public.user_push_subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);


-- Create a table to log all notification attempts
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app')),
  recipient_id UUID REFERENCES auth.users,
  email TEXT,
  subject TEXT,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS notification_logs_recipient_idx ON public.notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS notification_logs_status_idx ON public.notification_logs(status);
CREATE INDEX IF NOT EXISTS notification_logs_created_at_idx ON public.notification_logs(created_at);

-- Add RLS policies
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to see all logs (would require admin role to be set up)
CREATE POLICY "Allow users to view their own notification logs"
ON public.notification_logs
FOR SELECT
USING (auth.uid() = recipient_id);

-- Create function to delete push subscription
CREATE OR REPLACE FUNCTION public.delete_push_subscription(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.user_push_subscriptions
  WHERE user_id = p_user_id;
END;
$$;

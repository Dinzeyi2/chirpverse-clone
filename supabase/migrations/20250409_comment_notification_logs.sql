
-- Create notification logs table
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_id UUID NOT NULL,
  email TEXT,
  subject TEXT,
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add appropriate indexes
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_id ON public.notification_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON public.notification_logs(created_at);

-- Add RLS policies
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own notification logs
CREATE POLICY "Users can view their own notification logs" 
  ON public.notification_logs FOR SELECT 
  USING (auth.uid() = recipient_id);

-- Allow service role to insert notification logs
CREATE POLICY "Service role can insert notification logs" 
  ON public.notification_logs FOR INSERT 
  WITH CHECK (true);

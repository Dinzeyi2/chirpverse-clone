
-- Function to safely upsert a push subscription
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(p_user_id UUID, p_subscription TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_push_subscriptions (user_id, subscription)
  VALUES (p_user_id, p_subscription)
  ON CONFLICT (user_id)
  DO UPDATE SET
    subscription = p_subscription,
    updated_at = NOW();
END;
$$;

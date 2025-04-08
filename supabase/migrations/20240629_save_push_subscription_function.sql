
-- Create a function to save push subscriptions
CREATE OR REPLACE FUNCTION public.save_push_subscription(
  p_user_id UUID,
  p_subscription TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_push_subscriptions (user_id, subscription, created_at, updated_at)
  VALUES (p_user_id, p_subscription, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET 
    subscription = p_subscription,
    updated_at = now();
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.save_push_subscription TO authenticated;

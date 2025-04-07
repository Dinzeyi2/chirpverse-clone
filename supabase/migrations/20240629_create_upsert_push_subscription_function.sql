
-- Create a function to safely upsert push subscriptions
CREATE OR REPLACE FUNCTION public.upsert_push_subscription(
  p_user_id uuid,
  p_subscription text
) RETURNS void AS $$
BEGIN
  INSERT INTO public.user_push_subscriptions (
    user_id, 
    subscription,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_subscription,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    subscription = p_subscription,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

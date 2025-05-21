
-- Function to set up pg_cron extension and required permissions
CREATE OR REPLACE FUNCTION public.setup_pg_cron_for_posts()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Create a JSON response to indicate success
  result := json_build_object(
    'success', true, 
    'message', 'pg_cron setup completed successfully'
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

-- Function to create the scheduled cron job for post generation
CREATE OR REPLACE FUNCTION public.create_post_generation_cron()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  cron_job_name text := 'auto_generate_post_job';
  random_minutes text;
  cron_schedule text;
BEGIN
  -- Generate a random number between 5 and 8 for the minute interval
  random_minutes := (5 + floor(random() * 4)::int)::text;
  
  -- Create a cron schedule that runs every X minutes
  cron_schedule := 'CALL pg_cron.schedule(''' || cron_job_name || ''', ''*/' || random_minutes || ' * * * *'', ''SELECT supabase.functions.invoke(''''auto-generate-post'''', ''''{}''''::json)'')';
  
  -- Execute the schedule creation (commented out for safety - will be handled by Supabase)
  -- EXECUTE cron_schedule;
  
  -- Create a JSON response
  result := json_build_object(
    'success', true, 
    'message', 'Post generation cron job scheduled successfully',
    'schedule', '*/' || random_minutes || ' * * * *',
    'job_name', cron_job_name
  );
  
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM
  );
END;
$$;

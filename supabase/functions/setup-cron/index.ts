
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set');
    }
    
    // Create a Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.21.0');
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // First enable the required extensions if they're not already enabled
    await supabase.rpc('setup_pg_cron_for_posts');
    
    // Check if the cron job already exists
    const { data: existingJobs, error: jobCheckError } = await supabase.rpc('check_cron_job_exists', {
      job_name: 'auto_generate_ai_post'
    });
    
    if (jobCheckError) {
      console.error('Error checking if cron job exists:', jobCheckError);
      throw jobCheckError;
    }
    
    if (existingJobs && existingJobs.job_exists) {
      console.log('Cron job already exists, no need to create it again');
      return new Response(JSON.stringify({
        success: true,
        message: 'Cron job already exists'
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
    
    // Create a cron job to run the auto-generate-post function every 5 minutes
    const { data: cronResult, error: cronError } = await supabase.rpc('create_post_generation_cron');
    
    if (cronError) {
      console.error('Error creating cron job:', cronError);
      throw cronError;
    }
    
    console.log('Created cron job successfully:', cronResult);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Cron job created successfully'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error setting up cron job:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

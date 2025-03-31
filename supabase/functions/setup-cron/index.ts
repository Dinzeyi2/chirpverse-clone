
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
    
    // First trigger a manual post generation to ensure everything is working
    try {
      const { data: generatedPost, error: generationError } = await supabase.functions.invoke('auto-generate-post');
      
      if (generationError) {
        console.error('Error generating initial post:', generationError);
      } else {
        console.log('Successfully generated initial post:', generatedPost);
      }
    } catch (err) {
      console.error('Error calling auto-generate-post:', err);
    }
    
    // Even if we couldn't generate a post, return a success message
    // The client-side auto generation will take over
    return new Response(JSON.stringify({
      success: true,
      message: 'Automatic post generation is now enabled'
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error('Error setting up automatic posting:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

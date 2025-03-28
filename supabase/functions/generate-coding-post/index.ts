
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
    const apiKey = Deno.env.get('PERPLEXITY_API_KEY');
    if (!apiKey) {
      throw new Error('PERPLEXITY_API_KEY is not set in Supabase secrets');
    }

    console.log("Generating coding problem post with Perplexity API");
    
    // Call Perplexity API to generate a coding problem post
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are an AI that generates realistic posts about coding problems. Sound exactly like a real frustrated programmer asking for help. Use an authentic tone and include code snippets when relevant. Focus on common, relatable coding issues that JavaScript, Python, React, TypeScript, CSS, or HTML developers face. Use language tags like @JavaScript, @React, etc.'
          },
          {
            role: 'user',
            content: 'Create a post about a real coding problem in JavaScript, Python, React, TypeScript, CSS, or HTML. Make it realistic, as if a real person is asking for help with a specific error or bug they encountered. Include relevant code snippets and mention the programming language with an @ symbol (e.g., @JavaScript, @React). Keep it under 280 characters.'
          }
        ],
        temperature: 0.9,
        max_tokens: 280,
        top_p: 0.95,
        frequency_penalty: 0.7
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Perplexity API error:", data);
      throw new Error(`Perplexity API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    const generatedContent = data.choices[0].message.content.trim();
    console.log("Generated content:", generatedContent);
    
    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating post:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


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

    console.log("Fetching real coding problems from Perplexity API");
    
    // Use Perplexity API to search for real coding issues on the web
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
            content: 'You are a web crawler that finds real coding questions from StackOverflow, Reddit, GitHub issues, and developer forums. When you find a question, rewrite it in a casual, conversational tone as if a real developer is asking for help. Remove any markdown formatting, headings, or special characters. Make it sound natural and informal, like someone typing a forum post. Always include a language tag like @JavaScript or @Python at the end of the question, not at the beginning.'
          },
          {
            role: 'user',
            content: 'Find a real coding problem from the web that a developer has posted online in the last year. Look for problems about JavaScript, Python, React, TypeScript, CSS, or HTML. Rewrite it to sound like a real person casually asking for help - use natural language, maybe some typos, and an informal tone. Make sure to include the programming language as a tag at the end (e.g., @JavaScript). Keep it under 280 characters if possible.'
          }
        ],
        temperature: 0.7,
        max_tokens: 280,
        top_p: 0.9,
        frequency_penalty: 0.7
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Perplexity API error:", data);
      throw new Error(`Perplexity API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    const generatedContent = data.choices[0].message.content.trim();
    console.log("Generated content from real issues:", generatedContent);
    
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

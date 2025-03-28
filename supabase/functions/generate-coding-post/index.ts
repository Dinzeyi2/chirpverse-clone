
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
    
    // Create a unique query with more randomization factors
    const timestamp = new Date().toISOString();
    const randomSeed = Math.floor(Math.random() * 10000).toString();
    const languages = ["JavaScript", "Python", "React", "TypeScript", "CSS", "HTML", "Node.js", "Vue", "Angular", "Java", "C#", "PHP"];
    const randomLanguage = languages[Math.floor(Math.random() * languages.length)];
    
    const uniqueQuery = `Find a real coding problem that a developer has posted online about ${randomLanguage}. Current time: ${timestamp}, Random seed: ${randomSeed}. Rewrite it as a casual question like someone would post on Reddit or Stack Overflow - use natural language, informal tone, and maybe a typo. Make it sound like a real human wrote it in a hurry. Include the programming language as a tag at the end (e.g., @${randomLanguage}). Keep it under 280 characters.`;
    
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
            content: 'You are a web crawler that finds real coding questions posted by developers online. When you find a question, rewrite it to sound casual and authentic - like someone quickly typing a forum post. Remove any markdown formatting. Make it sound natural and conversational, with some casual words. Always include a language tag like @JavaScript or @Python at the end of the question, not at the beginning. IMPORTANT: Each response must be unique and different from previous ones. Never generate the same content twice.'
          },
          {
            role: 'user',
            content: uniqueQuery
          }
        ],
        temperature: 0.9,
        max_tokens: 280,
        top_p: 0.95,
        // Remove one of these penalties - can't use both
        frequency_penalty: 0.7,
        // presence_penalty: 0.7  // Removed this line to fix the error
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

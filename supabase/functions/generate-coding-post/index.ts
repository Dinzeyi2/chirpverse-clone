
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Create a Supabase client with service role key to bypass RLS policies
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not available in environment');
    }
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
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
            content: 'You are a web crawler that finds real coding questions posted by developers online. When you find a question, rewrite it to sound casual and authentic - like someone quickly typing a forum post. Remove any markdown formatting. Make it sound natural and conversational, with some casual words. Always include a language tag like @JavaScript or @Python at the end of the question, not at the beginning. IMPORTANT: Each response must be unique and different from previous ones. Never generate the same content twice. IMPORTANT: Do not include code blocks with import statements that repeat multiple times. Limit any code snippets to 5-10 lines maximum and make them relevant.'
          },
          {
            role: 'user',
            content: uniqueQuery
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
    
    // Verify the content doesn't have repetitive import statements
    let generatedContent = data.choices[0].message.content.trim();
    
    // Check for repetitive import patterns and truncate if necessary
    if (generatedContent.includes('using System.Collections') || 
        generatedContent.includes('import ') || 
        generatedContent.includes('#include')) {
      
      const lines = generatedContent.split('\n');
      let repetitionStartIndex = -1;
      
      // Find where repetition might start
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].trim() === lines[i+1].trim() && lines[i].trim().length > 0) {
          repetitionStartIndex = i;
          break;
        }
      }
      
      // Truncate if repetition found
      if (repetitionStartIndex > 0) {
        generatedContent = lines.slice(0, repetitionStartIndex + 1).join('\n') + 
                          '\n// ... additional imports truncated for brevity';
      }
    }
    
    console.log("Generated content from real issues:", generatedContent);
    
    // Generate random username for the blue user
    const generateRandomUsername = () => {
      const adjectives = ['cool', 'super', 'awesome', 'coding', 'dev', 'tech', 'data', 'web', 'pro', 'smart'];
      const nouns = ['coder', 'dev', 'builder', 'creator', 'ninja', 'guru', 'hacker', 'wizard', 'expert', 'geek'];
      
      if (Math.random() > 0.5) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        return `blue${adj}${noun}${num}`;
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 90000).toString();
        return `blue${randomNum}`;
      }
    };
    
    // Insert the new post with service role client to bypass RLS
    try {
      const blueUserId = "513259a2-555a-4c73-8ce5-db537e33b546";
      const displayUsername = generateRandomUsername();
      
      console.log(`Inserting new post with user_id: ${blueUserId} and display username: ${displayUsername}`);
      
      const { data: insertedPost, error: insertError } = await supabaseAdmin
        .from('shoutouts')
        .insert({
          content: generatedContent,
          user_id: blueUserId,
          metadata: {
            display_username: displayUsername,
            is_ai_generated: true
          }
        })
        .select('id')
        .single();
        
      if (insertError) {
        console.error('Error inserting AI post:', insertError);
        throw new Error(`Failed to save post to database: ${insertError.message}`);
      }
      
      console.log('Successfully inserted AI post with ID:', insertedPost?.id);
    } catch (dbError) {
      console.error('Database operation error:', dbError);
      throw dbError;
    }
    
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


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
    
    // Improved prompt that avoids repetitive patterns and ensures more natural, varied questions
    const uniqueQuery = `Find a real, interesting coding problem that a developer might face when working with ${randomLanguage}. Current time: ${timestamp}, Random seed: ${randomSeed}. Write it as a casual question like someone would post on Reddit or Stack Overflow - use natural language, conversational tone, and keep it authentic. Make it sound like a real human wrote it. Include specific details about the error or challenge they're facing. Do NOT include repetitive patterns of keywords, error messages, or text that repeats "data_column" multiple times. Keep the entire post under 280 characters. Include the programming language as a tag at the end (e.g., @${randomLanguage}).`;
    
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
            content: 'You are a web crawler that finds real coding questions posted by developers online. When you find a question, rewrite it to sound casual and authentic. Follow these STRICT rules: 1) NEVER repeat patterns like "data_column" multiple times, 2) NEVER include overly long error messages, 3) Keep content diverse and interesting, 4) Make questions focused on a specific problem a developer might face, 5) Include the language tag at the end, 6) Keep content under 280 characters. If you see repetitive text patterns forming, STOP and rewrite completely.'
          },
          {
            role: 'user',
            content: uniqueQuery
          }
        ],
        temperature: 0.9,
        max_tokens: 280,
        top_p: 0.95,
        frequency_penalty: 0.9
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Perplexity API error:", data);
      throw new Error(`Perplexity API returned ${response.status}: ${JSON.stringify(data)}`);
    }
    
    let generatedContent = data.choices[0].message.content.trim();
    
    // Verify content quality and prevent repetitive patterns
    if (generatedContent.includes('data_column') || 
        (generatedContent.match(/\*\*/g) || []).length > 4 || 
        generatedContent.includes('error:') && generatedContent.length > 150) {
      
      // If we detect problematic patterns, generate a fallback question
      const fallbackQuestions = [
        `Anyone know why my ${randomLanguage} app crashes whenever I try to load images from an API? Been stuck on this for hours! @${randomLanguage}`,
        `How do I optimize this ${randomLanguage} function that's taking forever to run? I think I messed up the algorithm somewhere. @${randomLanguage}`,
        `Need help with ${randomLanguage} routing - my pages load but all the styles disappear when I navigate between them. Any ideas? @${randomLanguage}`,
        `Just spent 3 hours debugging my ${randomLanguage} code only to find I misspelled a variable name. What's your worst coding facepalm moment? @${randomLanguage}`,
        `Working on a ${randomLanguage} project and can't figure out why my tests are failing in CI but pass locally. Environment issue maybe? @${randomLanguage}`
      ];
      
      generatedContent = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
      console.log("Used fallback question due to poor quality generated content");
    }
    
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

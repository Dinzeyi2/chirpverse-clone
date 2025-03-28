
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

    const { postContent } = await req.json();
    
    if (!postContent) {
      throw new Error('Post content is required');
    }

    console.log("Generating AI comment for post:", postContent.substring(0, 50) + "...");
    
    // Create a unique query with randomization factors
    const timestamp = new Date().toISOString();
    const randomSeed = Math.floor(Math.random() * 10000).toString();
    
    // We'll generate 1-3 comments for the post
    const commentsToGenerate = Math.floor(Math.random() * 3) + 2; // Ensuring at least 2 comments
    const comments = [];
    
    // Generate random blue usernames for comments
    const generateRandomBlueUsername = () => {
      // List of potential words to make the username feel more natural
      const adjectives = ['cool', 'super', 'awesome', 'coding', 'dev', 'tech', 'data', 'web', 'pro', 'smart'];
      const nouns = ['coder', 'dev', 'builder', 'creator', 'ninja', 'guru', 'hacker', 'wizard', 'expert', 'geek'];
      
      // 50% chance to use a word-based username, 50% chance to use a number-based one
      if (Math.random() > 0.5) {
        const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const noun = nouns[Math.floor(Math.random() * nouns.length)];
        const num = Math.floor(Math.random() * 1000);
        return `blue${adj}${noun}${num}`;
      } else {
        // Generate a random 3-5 digit number
        const randomNum = Math.floor(1000 + Math.random() * 90000).toString();
        return `blue${randomNum}`;
      }
    };
    
    // Generate some random emojis for each comment
    const generateRandomEmojis = () => {
      const emojis = ['👍', '❤️', '🔥', '🚀', '✨', '💯', '👏', '🙌', '😊', '👌', '🤔', '💡', '👨‍💻', '💪', '🎯'];
      const emojiCount = Math.floor(Math.random() * 3) + 1; // 1-3 emojis
      const selectedEmojis = [];
      
      for (let i = 0; i < emojiCount; i++) {
        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
        if (!selectedEmojis.includes(emoji)) {
          selectedEmojis.push(emoji);
        }
      }
      
      return selectedEmojis;
    };
    
    for (let i = 0; i < commentsToGenerate; i++) {
      const uniqueQuery = `Generate a helpful, supportive reply to this coding question: "${postContent}". 
      Make the reply sound like a real developer trying to help. Keep it under 200 characters.
      Current time: ${timestamp}, Random seed: ${randomSeed}-${i}.
      The comment should offer advice, ask clarifying questions, or share personal experience.`;
      
      // Generate a unique username for this comment
      const displayUsername = generateRandomBlueUsername();
      
      // Generate random emoji reactions for this comment
      const randomEmojis = generateRandomEmojis();
      
      // Use Perplexity API to generate a realistic comment
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
              content: 'You are a helpful developer who comments on coding questions. Keep your responses conversational, helpful and concise. Always sound like a real person typing a quick reply on social media.'
            },
            {
              role: 'user',
              content: uniqueQuery
            }
          ],
          temperature: 0.8,
          max_tokens: 250,
          top_p: 0.95,
          frequency_penalty: 0.7
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Perplexity API error:", errorData);
        throw new Error(`Perplexity API returned ${response.status}: ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      const generatedComment = data.choices[0].message.content.trim();
      
      comments.push({
        content: generatedComment,
        displayUsername: displayUsername,
        reactions: randomEmojis
      });
      
      // Add a small delay between requests to avoid rate limiting
      if (i < commentsToGenerate - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return new Response(JSON.stringify({ comments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error generating comment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});


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

    const { postContent, commentsCount = 3 } = await req.json();
    
    if (!postContent) {
      throw new Error('Post content is required');
    }

    console.log("Generating AI comment for post:", postContent.substring(0, 50) + "...");
    console.log(`Requested comment count: ${commentsCount}`);
    
    // Ensure commentsCount is within reasonable limits, but increase minimum to 10
    // This ensures we always get more comments than before
    const actualCommentsCount = Math.min(Math.max(parseInt(commentsCount, 10) || 10, 10), 40);
    
    // Create a unique query with randomization factors
    const timestamp = new Date().toISOString();
    const randomSeed = Math.floor(Math.random() * 10000).toString();
    
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
    
    // Generate fallback comments when API can't handle all the requested comments
    const generateFallbackComments = (count) => {
      const fallbackResponses = [
        "Have you tried clearing your cache?",
        "I had the same issue last week, try checking the console logs.",
        "This looks like a scope problem to me.",
        "Works on my machine! 😅",
        "Did you install all the dependencies?",
        "Check your import statements, there might be a typo.",
        "Have you tried turning it off and on again?",
        "The documentation has a section on this exact problem.",
        "Is your API key still valid?",
        "Try a different browser, might be a compatibility issue.",
        "Add some console.log statements to debug the flow.",
        "Maybe it's a race condition? Try adding async/await.",
        "This is definitely a CSS quirk, I've seen it before.",
        "Your linter might be able to catch this error.",
        "Check if you're using the latest package versions.",
        "Are you sure your server is running?",
        "Could be a caching issue, try hard-refreshing.",
        "This is a known bug in the framework, there's a workaround.",
        "I'd recommend using a different approach altogether.",
        "Check your network tab for any failed requests.",
        "Sometimes restarting the development server helps",
        "I bet there's a missing closing bracket somewhere",
        "Does this happen in production or just dev?",
        "The problem might be in how the data is structured",
        "Have you checked for null or undefined values?",
        "Your environment variables might not be loaded correctly",
        "This looks like a classic race condition to me",
        "Did you remember to initialize the state?",
        "I'd double check your package version compatibility",
        "Maybe try with a different browser to rule out extensions",
        "Could be an issue with how you're handling async code",
        "Try stepping through with the debugger to find the exact point of failure",
        "This reminds me of an issue I had with memory leaks",
        "Are you properly cleaning up event listeners?",
        "Check your webpack config, might be a bundling issue",
        "Did you import the correct function from the library?",
        "I've found that using a different approach works better here",
        "Make sure your API endpoint is correctly formatted",
        "Have you checked your network tab to see the response?",
        "Looks like you might be missing some error handling"
      ];
      
      const results = [];
      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
        const displayUsername = generateRandomBlueUsername();
        const randomEmojis = generateRandomEmojis();
        
        results.push({
          content: fallbackResponses[randomIndex],
          displayUsername: displayUsername,
          reactions: randomEmojis
        });
      }
      
      return results;
    };
    
    // We'll use a batch approach to handle many comments
    // Generate up to 20 comments with API, then use fallbacks if more needed
    const apiGenerationCount = Math.min(actualCommentsCount, 20);
    const fallbackCount = actualCommentsCount - apiGenerationCount;
    
    // Generate comments with the API (up to apiGenerationCount)
    for (let i = 0; i < apiGenerationCount; i++) {
      try {
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
      } catch (error) {
        console.error(`Error generating comment ${i+1}:`, error);
        // Add a fallback comment if API generation fails
        const fallbackComment = generateFallbackComments(1)[0];
        comments.push(fallbackComment);
      }
      
      // Add a small delay between requests to avoid rate limiting
      if (i < apiGenerationCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
    // If we need more comments beyond what we got from the API, use fallbacks
    if (fallbackCount > 0) {
      const fallbackComments = generateFallbackComments(fallbackCount);
      comments.push(...fallbackComments);
    }
    
    // Shuffle the comments to mix API and fallback responses
    const shuffledComments = comments.sort(() => Math.random() - 0.5);

    return new Response(JSON.stringify({ comments: shuffledComments }), {
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

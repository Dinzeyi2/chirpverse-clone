
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
    
    // Make query more focused on real developer questions with code issues
    const uniqueQuery = `Find a real coding problem that a developer has posted online about ${randomLanguage}. Current time: ${timestamp}, Random seed: ${randomSeed}. Format it as a casual question like someone would post on Stack Overflow or Reddit - use natural language, informal tone, and include code snippets when relevant. Make it sound like a real human wrote it with a specific coding issue they're trying to solve. Include the programming language as a tag at the end (e.g., @${randomLanguage}). Keep it under 280 characters total.`;
    
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
            content: 'You are a web crawler that finds real coding questions posted by developers online. When you find a question, rewrite it to sound casual and authentic - like someone quickly typing a forum post. Include some code snippets when appropriate. Make it sound natural and conversational, with some casual words and maybe a few typos. Format the question with ** at the beginning like **HTML issue** or **React problem** to categorize it. Always include a language tag like @JavaScript or @Python at the end of the question. IMPORTANT: Each response must be unique and different from previous ones. Never generate the same content twice. IMPORTANT: If you include code snippets, keep them short (5-10 lines max) and make sure they demonstrate a specific problem the user is having.'
          },
          {
            role: 'user',
            content: uniqueQuery
          }
        ],
        temperature: 1.0,
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
    
    // Ensure the post has code formatting
    if (!generatedContent.includes('```') && Math.random() > 0.5) {
      // Add code block if missing
      const codeSnippets = {
        "JavaScript": 'document.getElementById("myElement").addEventListener("click", () => {\n  console.log("Why isn\'t this working?");\n});',
        "Python": 'def process_data(items):\n  return [x for x in items if x > 0]\n\nresult = process_data([1, -2, 3])\nprint(result)',
        "HTML": '<div class="container">\n  <button id="btn">Click me</button>\n</div>',
        "CSS": '.my-class {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n}',
        "React": 'const [items, setItems] = useState([]);\nuseEffect(() => {\n  fetchData().then(data => setItems(data));\n}, []);',
        "TypeScript": 'interface User {\n  name: string;\n  age: number;\n}\n\nfunction greet(user: User) {\n  return `Hello ${user.name}`;\n}',
      };
      
      if (randomLanguage in codeSnippets) {
        if (generatedContent.includes("?")) {
          const questionParts = generatedContent.split("?");
          generatedContent = questionParts[0] + "? Here's my code:\n```\n" + codeSnippets[randomLanguage] + "\n```\n" + questionParts.slice(1).join("?");
        } else {
          generatedContent = generatedContent + "\n\n```\n" + codeSnippets[randomLanguage] + "\n```";
        }
      }
    }
    
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

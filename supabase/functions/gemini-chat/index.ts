
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if API key exists
    if (!geminiApiKey) {
      console.error("Missing GEMINI_API_KEY environment variable");
      throw new Error("API key not configured");
    }

    const { messages } = await req.json();
    
    console.log("Received request with messages:", JSON.stringify(messages));

    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid or missing messages array");
    }

    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    console.log("Formatted messages for Gemini:", JSON.stringify(formattedMessages));

    // Call Gemini 1.5 Pro model (using a model that actually exists)
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: formattedMessages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    });

    const responseText = await response.text();
    console.log("Raw Gemini API response:", responseText);

    if (!response.ok) {
      console.error("Gemini API Error:", responseText);
      throw new Error(`Gemini API error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error("Error parsing JSON response:", e);
      throw new Error("Invalid JSON response from Gemini API");
    }

    console.log("Parsed Gemini API response:", JSON.stringify(data));

    let generatedText = "";
    if (data.candidates && data.candidates.length > 0 && data.candidates[0]?.content?.parts) {
      generatedText = data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected response format:", JSON.stringify(data));
      throw new Error("Unexpected response format from Gemini API");
    }

    return new Response(JSON.stringify({ message: generatedText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

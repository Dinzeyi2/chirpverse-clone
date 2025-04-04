
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
    const requestData = await req.json();
    const { messages } = requestData;
    
    console.log("Received request with data:", JSON.stringify(requestData));
    
    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables");
      return new Response(
        JSON.stringify({ error: 'API key not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error("Invalid or empty messages array received");
      return new Response(
        JSON.stringify({ error: 'Invalid message format' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format messages for Gemini API
    const formattedMessages = messages.map(msg => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.content }]
    }));

    console.log("Formatted messages for Gemini:", JSON.stringify(formattedMessages));
    
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-experimental:generateContent';
    const requestBody = {
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    };
    
    console.log("Sending request to Gemini API:", JSON.stringify(requestBody));

    // Call Gemini API
    const response = await fetch(`${apiUrl}?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Gemini API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", errorText);
      return new Response(
        JSON.stringify({ error: `Gemini API error: ${response.status}` }), 
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const responseData = await response.json();
    console.log("Gemini API response:", JSON.stringify(responseData));

    let generatedText = "";
    if (responseData.candidates && 
        responseData.candidates[0]?.content?.parts && 
        responseData.candidates[0]?.content?.parts.length > 0) {
      
      generatedText = responseData.candidates[0].content.parts[0].text;
      console.log("Generated text to return:", generatedText);
      
      return new Response(
        JSON.stringify({ message: generatedText }), 
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error("Unexpected response format:", JSON.stringify(responseData));
      return new Response(
        JSON.stringify({ error: "Invalid response from Gemini API" }), 
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

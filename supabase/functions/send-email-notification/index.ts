
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    const { userId, title, body, postId } = await req.json()
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    // Get the user's email
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('email')
      .eq('user_id', userId)
      .single()
    
    if (userError || !userData?.email) {
      console.error('Error fetching user email:', userError)
      return new Response(
        JSON.stringify({ error: 'User email not found' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Construct the application URL with the post ID if available
    const baseUrl = Deno.env.get('APP_URL') || 'https://app.lovable.dev'
    const postUrl = postId ? `${baseUrl}/post/${postId}` : baseUrl
    
    // Prepare the email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 5px;">
        <h2 style="color: #333;">${title}</h2>
        <p style="color: #666; font-size: 16px; line-height: 1.5;">${body}</p>
        <div style="margin-top: 25px;">
          <a href="${postUrl}" style="background-color: #3b82f6; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">View Post</a>
        </div>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">You received this email because you enabled notifications in your account settings.</p>
      </div>
    `
    
    // Send the email using Supabase Auth's email service
    const { error: emailError } = await supabaseClient.auth.admin.sendRawEmail({
      email: userData.email,
      subject: title,
      html: emailContent,
    })
    
    if (emailError) {
      console.error('Error sending email:', emailError)
      return new Response(
        JSON.stringify({ error: 'Failed to send email notification' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }
    
    console.log(`Email notification sent to ${userData.email}`)
    
    return new Response(
      JSON.stringify({ success: true, message: 'Email notification sent' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in send-email-notification:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process email notification' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

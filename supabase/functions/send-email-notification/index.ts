
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    })
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    const { userId, subject, body, postId, priority = 'normal' } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing email notification for user ${userId} (priority: ${priority})`)

    // Get the user's email and notification preferences
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('email, email_notifications_enabled')
      .eq('user_id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user email:', userError)
      return new Response(
        JSON.stringify({ error: 'Error fetching user email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Check if user has email and has notifications enabled
    if (!userData?.email || userData.email_notifications_enabled === false) {
      const reason = !userData?.email ? 'No email found for user' : 'Email notifications are disabled for this user'
      console.log(reason)
      return new Response(
        JSON.stringify({ message: reason }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create a URL to the post
    const appUrl = Deno.env.get('APP_URL') || 'https://i-blue.dev'
    const postUrl = `${appUrl}/post/${postId}`

    // Generate simple HTML email
    const htmlEmail = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .content { margin-bottom: 30px; }
            .button { display: inline-block; padding: 10px 20px; background-color: #3b82f6; color: white; 
                    text-decoration: none; border-radius: 4px; font-weight: bold; }
            .footer { font-size: 12px; color: #666; margin-top: 30px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>iBlue Notification</h2>
            </div>
            <div class="content">
              <p>${body}</p>
              <p style="text-align: center; margin-top: 30px;">
                <a href="${postUrl}" class="button">View Post</a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated message from iBlue. Please do not reply to this email.</p>
              <p>If you don't want to receive these notifications, you can update your preferences in your account settings.</p>
            </div>
          </div>
        </body>
      </html>
    `

    // Use a email sending service (example with a simple fetch to a hypothetical email API)
    // In a real implementation, you would use a service like SendGrid, Mailgun, Resend, etc.
    // For this example, we'll use Resend which has a simple API
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set')
      return new Response(
        JSON.stringify({ error: 'Email service is not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`Sending email to ${userData.email} with subject: ${subject}`)
    
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify({
        from: 'notifications@i-blue.dev',
        to: userData.email,
        subject: subject || 'New iBlue Notification',
        html: htmlEmail,
        // Add tracking for email opens and clicks
        track_opens: true,
        track_clicks: true
      })
    })

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text()
      console.error('Failed to send email:', errorData)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const emailResult = await emailResponse.json()
    console.log('Email sent successfully:', emailResult)

    return new Response(
      JSON.stringify({ success: true, message: 'Email notification sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error sending email notification:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to send notification: ' + error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

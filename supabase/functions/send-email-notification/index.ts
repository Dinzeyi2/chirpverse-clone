
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
    console.log('Starting send-email-notification function...');
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body with careful error handling
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', JSON.stringify(requestBody));
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    const { userId, subject, body, postId, priority = 'normal', debug = true, recipientName = 'iBlue User' } = requestBody;

    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ error: 'Missing required userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing email notification for user ${userId}`);

    // Get the user's email and notification preferences - directly check if email_notifications_enabled is true
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('email, email_notifications_enabled')
      .eq('user_id', userId)
      .eq('email_notifications_enabled', true)  // Only fetch if notifications are enabled
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        // This is the "no rows returned" error from PostgREST
        console.log(`User ${userId} has not enabled email notifications`);
        return new Response(
          JSON.stringify({ message: 'User has not enabled email notifications' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      
      console.error('Error fetching user email:', userError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user email', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (debug) {
      console.log('User data found:', JSON.stringify(userData));
    }

    // Check if user has email
    if (!userData?.email) {
      console.log('No email found for user');
      return new Response(
        JSON.stringify({ message: 'No email found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create a URL to the post
    const appUrl = Deno.env.get('APP_URL') || 'https://i-blue.dev';
    const postUrl = `${appUrl}/post/${postId}`;

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
              <p>Hi ${recipientName},</p>
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
    `;

    // Check for Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not set');
      return new Response(
        JSON.stringify({ error: 'Email service is not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`Sending email to ${userData.email} with subject: ${subject}`);
    
    // Send email using Resend
    const emailData = {
      from: 'iBlue Notifications <notifications@i-blue.dev>',
      to: userData.email,
      subject: subject || 'New iBlue Notification',
      html: htmlEmail,
      // Add tracking for email opens and clicks
      track_opens: true,
      track_clicks: true
    };
    
    if (debug) {
      console.log('Email payload:', JSON.stringify(emailData));
    }
    
    try {
      // Send the email
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify(emailData)
      });

      // Handle response
      if (!emailResponse.ok) {
        const errorResponseText = await emailResponse.text();
        console.error('Failed to send email:', errorResponseText);
        return new Response(
          JSON.stringify({ error: 'Failed to send email', details: errorResponseText }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const emailResult = await emailResponse.json();
      console.log('Email sent successfully:', emailResult);

      return new Response(
        JSON.stringify({ success: true, message: 'Email notification sent successfully', result: emailResult }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } catch (emailError) {
      console.error('Error sending email via Resend:', emailError);
      console.error(emailError.stack);
      
      return new Response(
        JSON.stringify({ error: 'Failed to send email: ' + emailError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    console.error(error.stack);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send notification: ' + error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

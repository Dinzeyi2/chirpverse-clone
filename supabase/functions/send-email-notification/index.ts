
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
    
    const { userId, subject, body, postId, priority = 'normal', debug = true } = requestBody;

    if (!userId) {
      console.error('Missing userId in request');
      return new Response(
        JSON.stringify({ error: 'Missing required userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log(`Processing email notification for user ${userId}`);

    // First get the user's profile data
    const { data: userData, error: userError } = await supabaseClient
      .from('profiles')
      .select('full_name, email_notifications_enabled, programming_languages')
      .eq('user_id', userId)
      .single()

    if (userError) {
      console.error('Error fetching user profile:', userError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user profile', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Now get the actual auth email from auth.users
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
    
    if (authError || !authUser || !authUser.user || !authUser.user.email) {
      console.error('Error fetching user auth details:', authError);
      return new Response(
        JSON.stringify({ error: 'Error fetching user auth email', details: authError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Use the actual auth email for sending - this is the user's real email used for login
    const userEmail = authUser.user.email;
    
    console.log('User profile data found:', JSON.stringify(userData));
    console.log('User programming languages:', userData?.programming_languages);
    console.log('Email notifications enabled:', userData?.email_notifications_enabled);
    console.log('User auth email:', userEmail);

    // Check if user has email and has notifications enabled
    if (!userEmail) {
      console.log('No email found for user');
      return new Response(
        JSON.stringify({ message: 'No email found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    
    if (userData?.email_notifications_enabled === false) {
      console.log('Email notifications are disabled for this user');
      return new Response(
        JSON.stringify({ message: 'Email notifications are disabled for this user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create a URL to the post
    const appUrl = Deno.env.get('APP_URL') || 'https://i-blue.dev';
    const postUrl = `${appUrl}/post/${postId}`;
    console.log('Generated post URL:', postUrl);
    console.log(`Will send email to: ${userEmail}`);

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
              <p>Hello ${userData?.full_name || 'there'},</p>
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
        JSON.stringify({ 
          error: 'Email service is not configured - RESEND_API_KEY is missing',
          instructions: 'Please set the RESEND_API_KEY in your Supabase edge function secrets' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`Sending email to ${userEmail} with subject: ${subject}`);
    
    // Send email using Resend
    const emailData = {
      from: 'notifications@i-blue.dev',
      to: userEmail,
      subject: subject || 'New iBlue Notification',
      html: htmlEmail,
      // Add tracking for email opens and clicks
      track_opens: true,
      track_clicks: true
    };
    
    console.log('Email payload:', JSON.stringify(emailData));
    
    // Send the email
    console.log('Sending email via Resend API...');
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`
      },
      body: JSON.stringify(emailData)
    });

    // Capture the full response text for better debugging
    const responseText = await emailResponse.text();
    console.log('Resend API raw response:', responseText);
    
    // Handle response
    if (!emailResponse.ok) {
      console.error('Failed to send email. Status:', emailResponse.status, 'Response:', responseText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email', 
          status: emailResponse.status,
          details: responseText 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Try to parse the response as JSON, but handle it gracefully if it's not valid JSON
    let emailResult;
    try {
      emailResult = JSON.parse(responseText);
    } catch (e) {
      console.log('Response is not valid JSON, using as text');
      emailResult = { text: responseText };
    }
    
    console.log('Email sent successfully:', emailResult);

    // Record the sent email in a new table for auditing
    try {
      const { error: logError } = await supabaseClient
        .from('notification_logs')
        .insert({
          type: 'email',
          recipient_id: userId,
          email: userEmail,
          subject: subject,
          status: 'sent',
          metadata: {
            postId: postId,
            response: emailResult
          }
        });
        
      if (logError) {
        console.error('Error logging the email notification:', logError);
      } else {
        console.log('Email notification logged successfully');
      }
    } catch (logError) {
      console.error('Exception logging the email notification:', logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully', 
        result: emailResult, 
        recipient: {
          userId: userId,
          email: userEmail,
          name: userData?.full_name
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    console.error('Error sending email notification:', error);
    
    return new Response(
      JSON.stringify({ error: 'Failed to send notification: ' + error.message, stack: error.stack }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

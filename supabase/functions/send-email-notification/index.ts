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
    
    const { userId, subject, body, postId, priority = 'normal', debug = true, skipEmailIfActive = true } = requestBody;

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

    // NEW: Always check if user is currently active before sending email
    console.log('Checking if user is currently active in the app...');
    
    // Check if the user has been active within the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: activeUsers, error: activeError } = await supabaseClient
      .from('user_sessions')
      .select('last_active')
      .eq('user_id', userId)
      .eq('is_online', true)  // Make sure to check the is_online flag
      .gte('last_active', fiveMinutesAgo)
      .limit(1);
    
    if (activeError) {
      console.error('Error checking user active status:', activeError);
    }
    
    if (!activeError && activeUsers && activeUsers.length > 0) {
      console.log(`User ${userId} is currently active in the app. Skipping email notification.`);
      console.log(`User last active: ${activeUsers[0].last_active}`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email notification skipped for active user',
          active: true 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // DUPLICATE CHECK: Check if we've recently sent a similar email to prevent duplicates
    // Look for similar email sent in the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: recentEmails, error: recentEmailsError } = await supabaseClient
      .from('notification_logs')
      .select('id, created_at, subject, metadata')
      .eq('recipient_id', userId)
      .eq('type', 'email')
      .eq('status', 'sent')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false });
      
    if (recentEmailsError) {
      console.error('Error checking for recent emails:', recentEmailsError);
    } else if (recentEmails && recentEmails.length > 0) {
      // Check if any recent email has the same subject and postId
      const duplicateEmail = recentEmails.find(email => 
        email.subject === subject && 
        email.metadata?.postId === postId
      );
      
      if (duplicateEmail) {
        console.log(`Duplicate email detected, skipping. Original sent at ${duplicateEmail.created_at}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Skipped sending duplicate email notification',
            duplicateOf: duplicateEmail.id,
            sentAt: duplicateEmail.created_at
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }
    }

    // Make sure the postId exists
    if (postId) {
      // Verify the post exists
      const { data: postData, error: postError } = await supabaseClient
        .from('shoutouts')
        .select('id')
        .eq('id', postId)
        .single();
        
      if (postError || !postData) {
        console.error('Post not found or error fetching post:', postError);
        console.log('Invalid postId:', postId);
      } else {
        console.log('Post found with ID:', postData.id);
      }
    }

    // Get the app base URL from environment variables
    const appUrl = Deno.env.get('APP_URL') || 'https://i-blue.dev';
    
    // UPDATED: Create the URL to the notifications page instead of the post page
    const notificationsUrl = `${appUrl}/notifications`;
    
    console.log('Generated notifications URL:', notificationsUrl);
    console.log(`Will send email to: ${userEmail}`);

    // Process the email subject to remove user names if needed
    let processedSubject = subject;
    if (subject && subject.includes('from ')) {
      // Remove "from [name]" from the subject line
      processedSubject = subject.replace(/from .+$/, '').trim();
    }

    // Update button label and generate simple HTML email with a button that links directly to the notifications page
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
            .post-url { word-break: break-all; color: #666; margin-top: 10px; font-size: 12px; }
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
                <a href="${notificationsUrl}" class="button">View Notifications</a>
              </p>
              <p class="post-url">
                If the button doesn't work, copy and paste this URL into your browser: ${notificationsUrl}
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

    console.log(`Sending email to ${userEmail} with subject: ${processedSubject}`);
    
    // Send email using Resend with the processed subject
    const emailData = {
      from: 'notifications@i-blue.dev',
      to: userEmail,
      subject: processedSubject || 'New iBlue Notification',
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

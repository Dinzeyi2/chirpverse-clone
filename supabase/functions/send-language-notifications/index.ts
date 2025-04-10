
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    console.log('Starting send-language-notifications function...');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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
    
    const { postId, languages = [], content = '', immediate = false, debug = true } = requestBody;
    
    if (!postId) {
      console.error('Missing postId in request');
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Processing notifications for post: ${postId}`);
    console.log(`Languages mentioned in post: ${languages.join(', ')}`);

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ 
          error: 'Email service API key is not configured',
          instructions: 'Please set the RESEND_API_KEY secret in the Supabase dashboard'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    } else {
      console.log('RESEND_API_KEY is properly configured');
    }

    const appUrl = Deno.env.get('APP_URL') || 'https://i-blue.dev';
    console.log('APP_URL configuration:', appUrl);

    const { data: post, error: postError } = await supabaseClient
      .from('shoutouts')
      .select('id, content, created_at, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch post details', details: postError }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    const postAuthorId = post.user_id;
    console.log(`Post author ID: ${postAuthorId}`);

    const { data: authorProfile, error: authorError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', postAuthorId)
      .single();

    if (authorError) {
      console.log('Could not fetch author profile:', authorError);
    }

    const { data: authorAuthData, error: authorAuthError } = await supabaseClient.auth.admin.getUserById(postAuthorId);
    
    if (authorAuthError) {
      console.log('Could not fetch author auth data:', authorAuthError);
    }

    const authorName = authorProfile?.full_name || 'Someone';
    console.log(`Post author name: ${authorName}`);
    
    console.log('Fetching users with email notifications enabled...');
    
    const { data: profilesWithNotifications, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, programming_languages, email_notifications_enabled, full_name')
      .eq('email_notifications_enabled', true)
      .not('user_id', 'eq', postAuthorId);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user profiles', details: profilesError }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`Found ${profilesWithNotifications?.length || 0} users with email notifications enabled`);
    
    if (!profilesWithNotifications || profilesWithNotifications.length === 0) {
      console.log('No users have email notifications enabled');
      return new Response(
        JSON.stringify({ 
          message: 'No users have email notifications enabled',
          status: 'success',
          usersCount: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    // Get list of users who have already been notified about this post to prevent duplicates
    const { data: alreadyNotified, error: notificationCheckError } = await supabaseClient
      .from('notification_logs')
      .select('recipient_id')
      .eq('type', 'email')
      .eq('status', 'sent')
      .eq('metadata->postId', postId);
      
    if (notificationCheckError) {
      console.error('Error checking for existing notifications:', notificationCheckError);
    }
    
    // Create a set of user IDs who have already been notified for fast lookups
    const alreadyNotifiedUserIds = new Set(
      alreadyNotified?.map(notification => notification.recipient_id) || []
    );
    console.log(`Found ${alreadyNotifiedUserIds.size} users already notified about this post`);
    
    // NEW: Check for currently active users
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: activeUsers, error: activeError } = await supabaseClient
      .from('user_sessions')
      .select('user_id, last_active')
      .gte('last_active', fiveMinutesAgo);
      
    // Create a set of active user IDs for fast lookups
    const activeUserIds = new Set(
      activeUsers?.map(session => session.user_id) || []
    );
    console.log(`Found ${activeUserIds.size} currently active users who will receive in-app notifications only`);
    
    // NEW: Check if users have already received their daily quota of emails
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const todayStart = new Date(today + 'T00:00:00Z').toISOString();
    const todayEnd = new Date(today + 'T23:59:59Z').toISOString();

    // Get count of notifications sent today per user
    const { data: todayNotifications, error: todayNotificationsError } = await supabaseClient
      .from('notification_logs')
      .select('recipient_id, created_at')
      .eq('type', 'email')
      .eq('status', 'sent')
      .gte('created_at', todayStart)
      .lte('created_at', todayEnd);
      
    if (todayNotificationsError) {
      console.error('Error checking notification count:', todayNotificationsError);
    }
    
    // Count notifications per user today
    const userNotificationCount = new Map();
    todayNotifications?.forEach(notification => {
      const userId = notification.recipient_id;
      userNotificationCount.set(userId, (userNotificationCount.get(userId) || 0) + 1);
    });
    
    console.log(`Notification counts for today:`, Object.fromEntries(userNotificationCount));
    
    // Determine if we should send morning or afternoon notifications
    const currentHour = new Date().getUTCHours();
    const isMorningWindow = currentHour >= 6 && currentHour < 12; // 6 AM - 12 PM UTC
    const isAfternoonWindow = currentHour >= 14 && currentHour < 20; // 2 PM - 8 PM UTC
    
    // For immediate notifications (when requested explicitly), ignore time windows
    const shouldSendEmail = immediate ? true : (isMorningWindow || isAfternoonWindow);

    if (!shouldSendEmail && !immediate) {
      console.log(`Current hour (${currentHour} UTC) is outside email delivery windows. Skipping email delivery.`);
    }
    
    let notificationsSent = 0;
    let notificationsSkipped = 0;
    let inAppNotificationsCreated = 0;
    const notificationResults = [];
    const notificationErrors = [];
    
    // Maximum emails per user per day
    const MAX_DAILY_EMAILS = 2;

    for (const profile of profilesWithNotifications) {
      try {
        // Skip users who have already been notified about this post
        if (alreadyNotifiedUserIds.has(profile.user_id)) {
          console.log(`User ${profile.user_id} already notified about this post, skipping`);
          notificationsSkipped++;
          continue;
        }
        
        const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(profile.user_id);
        
        if (userError || !userData || !userData.user || !userData.user.email) {
          console.error(`Error fetching auth email for user ${profile.user_id}:`, userError);
          notificationsSkipped++;
          notificationErrors.push({
            userId: profile.user_id,
            error: userError?.message || "No email found in auth record"
          });
          continue;
        }
        
        const userEmail = userData.user.email;
        console.log(`Processing user ${profile.user_id} (${profile.full_name || 'unnamed'}) with email: ${userEmail}`);
        
        let userLanguages = [];
        console.log(`User programming_languages:`, profile.programming_languages);
        
        if (profile.programming_languages) {
          if (Array.isArray(profile.programming_languages)) {
            userLanguages = profile.programming_languages;
          } else if (typeof profile.programming_languages === 'string') {
            try {
              const parsed = JSON.parse(profile.programming_languages);
              userLanguages = Array.isArray(parsed) ? parsed : [profile.programming_languages];
            } catch (e) {
              userLanguages = [profile.programming_languages];
            }
          }
        }
        
        if (!userLanguages.length) {
          console.log(`User ${profile.user_id} has no programming languages set, skipping`);
          notificationsSkipped++;
          continue;
        }

        const userLanguagesLower = userLanguages.map(lang => lang.toLowerCase());
        console.log(`User ${profile.user_id} has languages: ${userLanguagesLower.join(', ')}`);
        
        const matchingLanguages = languages.filter(lang => 
          userLanguagesLower.includes(lang.toLowerCase())
        );
        
        console.log(`Matching languages for user ${profile.user_id}: ${matchingLanguages.join(', ')}`);
        
        if (matchingLanguages.length > 0) {
          console.log(`Creating in-app notification for user ${profile.user_id} about languages: ${matchingLanguages.join(', ')}`);
          
          const languageList = matchingLanguages.join(', ');
          
          // Modified: Remove author name from email subject
          const emailSubject = `New post about ${languageList}`;
          
          const truncatedContent = content.length > 200 ? content.substring(0, 200) + '...' : content;
          
          // Modified: Remove author name from email body
          const emailBody = `New post about ${languageList} on iBlue:
          
"${truncatedContent}"

Check out the full post and join the conversation!`;

          // Direct URL to the post instead of notifications page
          const directPostUrl = `${appUrl}/post/${postId}`;
          
          try {
            // ALWAYS create an in-app notification regardless of email status
            const { error: notifError } = await supabaseClient
              .from('notifications')
              .insert({
                recipient_id: profile.user_id,
                sender_id: postAuthorId,
                type: 'language_mention',
                // Modified: Remove author name from notification content
                content: `New post about ${languageList}`,
                metadata: {
                  languages: matchingLanguages,
                  post_id: postId,
                  post_excerpt: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                  author_name: authorName // We still store this internally, but don't show it
                }
              });
              
            if (notifError) {
              console.error(`Error creating in-app notification for user ${profile.user_id}:`, notifError);
            } else {
              console.log(`Created in-app notification for user ${profile.user_id}`);
              inAppNotificationsCreated++;
            }

            // Check if user is currently active - if so, skip email notification
            const isUserActive = activeUserIds.has(profile.user_id);
            
            if (isUserActive) {
              console.log(`User ${profile.user_id} is currently active in the app. Skipping email notification.`);
              notificationResults.push({
                userId: profile.user_id,
                name: profile.full_name,
                email: userEmail,
                languages: matchingLanguages,
                success: true,
                active: true,
                emailSent: false,
                message: "User is active, skipped email notification"
              });
              continue; // Skip email sending for active users
            }
            
            // NEW: Check if user has already reached their daily email quota
            const userDailyCount = userNotificationCount.get(profile.user_id) || 0;
            if (userDailyCount >= MAX_DAILY_EMAILS && !immediate) {
              console.log(`User ${profile.user_id} already received ${userDailyCount} notifications today (max: ${MAX_DAILY_EMAILS}). Skipping email.`);
              notificationResults.push({
                userId: profile.user_id,
                name: profile.full_name,
                email: userEmail,
                languages: matchingLanguages,
                success: true,
                emailSent: false,
                dailyLimit: true,
                message: `Daily limit (${MAX_DAILY_EMAILS}) reached`
              });
              continue; // Skip email for users who reached their daily limit
            }
            
            // Skip email if not in the right time window (unless immediate=true)
            if (!shouldSendEmail) {
              console.log(`Not in email delivery window. Skipping email for user ${profile.user_id}.`);
              notificationResults.push({
                userId: profile.user_id,
                name: profile.full_name,
                email: userEmail,
                languages: matchingLanguages,
                success: true,
                emailSent: false,
                outsideWindow: true,
                message: "Outside email delivery window"
              });
              continue;
            }

            // Send email notification if user passed all checks
            const response = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  userId: profile.user_id,
                  subject: emailSubject,
                  body: emailBody,
                  postId: postId,
                  priority: 'high',
                  skipEmailIfActive: true, // Tell the email function to check for active users
                  viewUrl: directPostUrl, // UPDATED: Use direct post URL
                  debug: debug
                }),
              }
            );

            const responseText = await response.text();
            console.log(`Email notification raw response: ${responseText}`);
            
            let responseJson;
            try {
              responseJson = JSON.parse(responseText);
            } catch (e) {
              responseJson = { text: responseText };
            }
            
            notificationResults.push({
              userId: profile.user_id,
              name: profile.full_name,
              email: userEmail,
              languages: matchingLanguages,
              success: response.ok,
              emailSent: response.ok && !responseJson?.active,
              response: responseJson,
              timeWindow: isMorningWindow ? "morning" : (isAfternoonWindow ? "afternoon" : "outside")
            });

            if (response.ok) {
              console.log(`Successfully sent email to user ${profile.full_name} (${profile.user_id}) at ${userEmail}`);
              notificationsSent++;
              
              // Update the user's daily notification count
              userNotificationCount.set(profile.user_id, (userNotificationCount.get(profile.user_id) || 0) + 1);
            } else {
              console.error(`Error sending email to user ${profile.user_id}:`, responseText);
              notificationErrors.push({
                userId: profile.user_id,
                error: responseText
              });
            }
          } catch (emailError) {
            console.error(`Exception sending email to user ${profile.user_id}:`, emailError);
            notificationErrors.push({
              userId: profile.user_id,
              error: emailError.message
            });
          }
        } else {
          console.log(`No matching languages for user ${profile.user_id}, skipping notification`);
          notificationsSkipped++;
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.user_id}:`, userError);
        notificationsSkipped++;
        notificationErrors.push({
          userId: profile.user_id,
          error: userError.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications processed. Sent ${notificationsSent} emails, created ${inAppNotificationsCreated} in-app notifications, skipped ${notificationsSkipped}`,
        post: {
          id: postId,
          languages: languages,
          authorId: postAuthorId,
          authorName: authorName
        },
        emailDeliveryWindow: {
          isMorningWindow,
          isAfternoonWindow,
          shouldSendEmail,
          currentHourUTC: currentHour,
          immediate
        },
        stats: {
          total_users: profilesWithNotifications?.length || 0,
          notifications_sent: notificationsSent,
          in_app_notifications_created: inAppNotificationsCreated,
          notifications_skipped: notificationsSkipped,
          active_users: activeUserIds.size,
          errors: notificationErrors.length
        },
        details: debug ? {
          results: notificationResults,
          errors: notificationErrors
        } : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-language-notifications:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process notifications: ' + error.message,
        stack: error.stack 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});


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
      status: 204
    })
  }

  try {
    console.log('Starting send-language-notifications function...');
    
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
    
    const { postId, languages = [], content = '', immediate = true, debug = true } = requestBody;
    
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

    // Check edge function secrets
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

    const appUrl = Deno.env.get('APP_URL');
    console.log('APP_URL configuration:', appUrl || 'Not set, will use default');

    // Get the post details
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

    // Get user who created the post to avoid sending them notifications
    const postAuthorId = post.user_id;
    console.log(`Post author ID: ${postAuthorId}`);

    // Get the post author's profile to include in the notification
    const { data: authorProfile, error: authorError } = await supabaseClient
      .from('profiles')
      .select('full_name')
      .eq('user_id', postAuthorId)
      .single();

    if (authorError) {
      console.log('Could not fetch author profile:', authorError);
    }

    // Get author's auth email 
    const { data: authorAuthData, error: authorAuthError } = await supabaseClient.auth.admin.getUserById(postAuthorId);
    
    if (authorAuthError) {
      console.log('Could not fetch author auth data:', authorAuthError);
    }

    const authorName = authorProfile?.full_name || 'Someone';
    console.log(`Post author name: ${authorName}`);
    
    // Debug: Test direct email sending with the author's email if available
    if (authorAuthData?.user?.email && debug) {
      console.log(`DEBUG: Testing direct email to author: ${authorAuthData.user.email}`);
      try {
        const testEmailResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            },
            body: JSON.stringify({
              userId: postAuthorId,
              subject: `TEST - Email Notification System Check`,
              body: `This is a test of the email notification system. It was triggered by your post about: ${languages.join(', ')}`,
              postId: postId,
              debug: true
            }),
          }
        );
        
        const testResponseText = await testEmailResponse.text();
        console.log(`TEST email response: ${testResponseText}`);
      } catch (testError) {
        console.error(`Error sending test email: ${testError}`);
      }
    }
    
    // Get all users with email notifications enabled
    console.log('Fetching users with email notifications enabled...');
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, programming_languages, email_notifications_enabled, full_name')
      .eq('email_notifications_enabled', true) // Only users who enabled email notifications
      .not('user_id', 'eq', postAuthorId); // Don't notify the post author

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users', details: usersError }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`Found ${users?.length || 0} users with email notifications enabled`);
    
    // Debug: log all users and their programming languages
    if (debug && users) {
      for (const user of users) {
        console.log(`User ${user.user_id} (${user.full_name || 'unnamed'})`);
        console.log(`Programming languages:`, user.programming_languages);
      }
    }
    
    if (users?.length === 0) {
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
    
    // Process notifications
    let notificationsSent = 0;
    let notificationsSkipped = 0;
    const notificationResults = [];
    const notificationErrors = [];

    // Send notifications to each user who has matching programming languages
    for (const user of users || []) {
      try {
        // Process user's programming_languages safely
        let userLanguages: string[] = [];
        console.log(`Processing user ${user.user_id} with programming_languages:`, user.programming_languages);
        
        if (user.programming_languages) {
          if (Array.isArray(user.programming_languages)) {
            userLanguages = user.programming_languages;
          } else if (typeof user.programming_languages === 'string') {
            try {
              const parsed = JSON.parse(user.programming_languages);
              userLanguages = Array.isArray(parsed) ? parsed : [user.programming_languages];
            } catch (e) {
              userLanguages = [user.programming_languages];
            }
          }
        }
        
        // Skip users without programming languages
        if (!userLanguages.length) {
          console.log(`User ${user.user_id} has no programming languages set, skipping`);
          notificationsSkipped++;
          continue;
        }

        // Convert user languages to lowercase for case-insensitive comparison
        const userLanguagesLower = userLanguages.map(lang => lang.toLowerCase());
        console.log(`User ${user.user_id} has languages: ${userLanguagesLower.join(', ')}`);
        
        // Find matching languages between the post and user's interests
        const matchingLanguages = languages.filter(lang => 
          userLanguagesLower.includes(lang.toLowerCase())
        );
        
        console.log(`Matching languages for user ${user.user_id}: ${matchingLanguages.join(', ')}`);
        
        // Only send notification if there are matching languages
        if (matchingLanguages.length > 0) {
          console.log(`Sending notification to user ${user.user_id} about languages: ${matchingLanguages.join(', ')}`);
          
          // Create a personalized message with the programming languages
          const languageList = matchingLanguages.join(', ');
          const emailSubject = `New post about ${languageList} from ${authorName}`;
          
          // Truncate content for the email if it's too long
          const truncatedContent = content.length > 200 ? content.substring(0, 200) + '...' : content;
          
          const emailBody = `${authorName} just posted about ${languageList} on iBlue:
          
"${truncatedContent}"

Check out the full post and join the conversation!`;
          
          try {
            // Call the send-email-notification function
            console.log(`Calling send-email-notification for user ${user.user_id}`);
            const response = await fetch(
              `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  userId: user.user_id,
                  subject: emailSubject,
                  body: emailBody,
                  postId: postId,
                  priority: 'high', // Send immediately
                  debug: debug
                }),
              }
            );

            // Get the full response text for better debugging
            const responseText = await response.text();
            console.log(`Email notification raw response: ${responseText}`);
            
            let responseJson;
            try {
              responseJson = JSON.parse(responseText);
            } catch (e) {
              responseJson = { text: responseText };
            }
            
            notificationResults.push({
              userId: user.user_id,
              name: user.full_name,
              languages: matchingLanguages,
              success: response.ok,
              response: responseJson
            });

            if (response.ok) {
              console.log(`Successfully sent email to user ${user.full_name} (${user.user_id})`);
              notificationsSent++;
              
              // Also create an in-app notification
              const { error: notifError } = await supabaseClient
                .from('notifications')
                .insert({
                  recipient_id: user.user_id,
                  sender_id: postAuthorId,
                  type: 'language_mention',
                  content: `New post about ${languageList} from ${authorName}`,
                  metadata: {
                    languages: matchingLanguages,
                    post_id: postId,
                    post_excerpt: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
                    author_name: authorName
                  }
                });
                
              if (notifError) {
                console.error(`Error creating in-app notification for user ${user.user_id}:`, notifError);
              } else {
                console.log(`Created in-app notification for user ${user.user_id}`);
              }
            } else {
              console.error(`Error sending email to user ${user.user_id}:`, responseText);
              notificationErrors.push({
                userId: user.user_id,
                error: responseText
              });
            }
          } catch (emailError) {
            console.error(`Exception sending email to user ${user.user_id}:`, emailError);
            notificationErrors.push({
              userId: user.user_id,
              error: emailError.message
            });
          }
        } else {
          console.log(`No matching languages for user ${user.user_id}, skipping notification`);
          notificationsSkipped++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        notificationsSkipped++;
        notificationErrors.push({
          userId: user.user_id,
          error: userError.message
        });
      }
    }

    // Return success response with detailed information
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications processed. Sent ${notificationsSent}, skipped ${notificationsSkipped}`,
        post: {
          id: postId,
          languages: languages,
          authorId: postAuthorId,
          authorName: authorName
        },
        stats: {
          total_users: users?.length || 0,
          notifications_sent: notificationsSent,
          notifications_skipped: notificationsSkipped,
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

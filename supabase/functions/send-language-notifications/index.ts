
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

    // Validate RESEND_API_KEY is set
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'Email service API key is not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    } else {
      console.log('RESEND_API_KEY is properly configured');
    }

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
      .select('full_name, email')
      .eq('user_id', postAuthorId)
      .single();

    if (authorError) {
      console.log('Could not fetch author profile:', authorError);
    }

    const authorName = authorProfile?.full_name || 'Someone';
    
    // Get all users with matching programming languages who have enabled notifications
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, programming_languages, email, email_notifications_enabled, full_name')
      .not('email', 'is', null)
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
    
    // Process notifications
    let notificationsSent = 0;
    let notificationsSkipped = 0;
    const notificationResults = [];

    // Send notifications to each user who has matching programming languages
    for (const user of users || []) {
      try {
        // Process user's programming_languages safely
        let userLanguages: string[] = [];
        
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

            const responseText = await response.text();
            let responseJson;
            try {
              responseJson = JSON.parse(responseText);
            } catch (e) {
              responseJson = { text: responseText };
            }
            
            notificationResults.push({
              userId: user.user_id,
              email: user.email,
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
            }
          } catch (emailError) {
            console.error(`Exception sending email to user ${user.user_id}:`, emailError);
          }
        } else {
          console.log(`No matching languages for user ${user.user_id}, skipping notification`);
          notificationsSkipped++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        notificationsSkipped++;
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications processed. Sent ${notificationsSent}, skipped ${notificationsSkipped}`,
        details: debug ? notificationResults : undefined
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in send-language-notifications:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process notifications: ' + error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

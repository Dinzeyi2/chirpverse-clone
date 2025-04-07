
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

    console.log(`Processing notifications for post: ${postId} (immediate: ${immediate}, debug: ${debug})`)
    console.log(`Languages explicitly passed: ${languages.join(', ') || 'none'}`)

    // Get the post details
    const { data: post, error: postError } = await supabaseClient
      .from('shoutouts')
      .select('id, content, created_at, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      console.error('Error fetching post:', postError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch post details' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    console.log('Post content:', post.content);

    // Extract programming languages mentioned in the post if not provided
    let languagesMentioned = languages.length > 0 ? languages : [];
    if (languagesMentioned.length === 0) {
      console.log('No languages explicitly provided, extracting from content...');
      
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(post.content)) !== null) {
        if (match[1]) {
          const language = match[1].toLowerCase().trim();
          languagesMentioned.push(language);
          console.log(`Found language mention: ${language}`);
        }
      }
    }

    console.log(`Languages mentioned in post: ${languagesMentioned.join(', ') || 'none'}`);

    if (languagesMentioned.length === 0) {
      console.log('No programming languages mentioned in this post');
      return new Response(
        JSON.stringify({ success: true, message: 'No programming languages to notify about' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    // Get all users with emails and programming languages who have enabled notifications
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, programming_languages, email, email_notifications_enabled')
      .not('email', 'is', null)
      .eq('email_notifications_enabled', true) // Only notify users who have enabled email notifications
      .not('user_id', 'eq', post.user_id) // Don't notify the author

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`Found ${users?.length || 0} users with email notifications enabled`);
    
    if (debug) {
      console.log('User profiles found:', JSON.stringify(users));
    }

    // Process notifications
    let notificationsSent = 0;
    let notificationsSkipped = 0;
    let notificationErrors = 0;
    const notificationResults = [];

    // Process each user
    for (const user of users || []) {
      try {
        // Skip users without programming languages
        if (!user.programming_languages || !Array.isArray(user.programming_languages) || user.programming_languages.length === 0) {
          console.log(`User ${user.user_id} has no programming languages set, skipping`);
          notificationsSkipped++;
          continue;
        }

        // Skip users who have not enabled email notifications
        if (user.email_notifications_enabled !== true) {
          console.log(`User ${user.user_id} has disabled email notifications, skipping`);
          notificationsSkipped++;
          continue;
        }

        // Find languages that match between the post and user's interests - case insensitive comparison
        const userLanguages = user.programming_languages.map(lang => lang.toLowerCase());
        
        if (debug) {
          console.log(`User ${user.user_id} is interested in languages: ${userLanguages.join(', ')}`);
          console.log(`Post mentions languages: ${languagesMentioned.join(', ')}`);
        }
        
        const relevantLanguages = languagesMentioned.filter(lang => 
          userLanguages.includes(lang.toLowerCase())
        );

        console.log(`User ${user.user_id} follows: ${userLanguages.join(', ')}`);
        console.log(`Relevant languages for user ${user.user_id}: ${relevantLanguages.join(', ') || 'none'}`);

        if (relevantLanguages.length > 0) {
          console.log(`Found ${relevantLanguages.length} relevant languages for user ${user.user_id}`);
          
          const languageList = relevantLanguages.join(', ');
          
          try {
            // Call the send-email-notification function directly with the full URL
            const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email-notification`;
            console.log(`Calling email notification function at: ${functionUrl}`);
            
            const response = await fetch(
              functionUrl,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                },
                body: JSON.stringify({
                  userId: user.user_id,
                  subject: `New post about ${languageList}`,
                  body: `There's a new post discussing ${languageList} on iBlue. Check it out and join the conversation!`,
                  postId: post.id,
                  priority: immediate ? 'high' : 'normal', // Add priority flag for immediate processing
                  debug: debug // Pass debug flag
                }),
              }
            );

            const responseText = await response.text();
            console.log(`Email notification response: ${responseText}`);
            
            let responseJson;
            try {
              responseJson = JSON.parse(responseText);
            } catch (e) {
              responseJson = { text: responseText };
            }
            
            notificationResults.push({
              userId: user.user_id,
              email: user.email,
              languages: relevantLanguages,
              success: response.ok,
              response: responseJson
            });

            if (!response.ok) {
              console.error(`Failed to send email notification to user ${user.user_id}:`, responseText);
              notificationErrors++;
            } else {
              console.log(`Successfully sent email notification to user ${user.user_id} about post ${post.id}`);
              notificationsSent++;
            }
          } catch (emailError) {
            console.error(`Error sending email to user ${user.user_id}:`, emailError);
            notificationErrors++;
            notificationResults.push({
              userId: user.user_id,
              email: user.email,
              languages: relevantLanguages,
              success: false,
              error: emailError.message
            });
          }
        } else {
          console.log(`No relevant languages found for user ${user.user_id}, skipping notification`);
          notificationsSkipped++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError);
        notificationsSkipped++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Language notifications processed. Sent ${notificationsSent} notifications, skipped ${notificationsSkipped}, errors ${notificationErrors}.`,
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

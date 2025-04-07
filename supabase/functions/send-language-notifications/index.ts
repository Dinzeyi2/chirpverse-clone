
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
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    const { postId, immediate = false } = await req.json()
    
    if (!postId) {
      return new Response(
        JSON.stringify({ error: 'Post ID is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    console.log(`Processing notifications for post: ${postId} (immediate: ${immediate})`)

    // Get the post details
    const { data: post, error: postError } = await supabaseClient
      .from('shoutouts')
      .select('id, content, created_at, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      console.error('Error fetching post:', postError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch post details' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 500 
        }
      )
    }

    // Extract programming languages mentioned in the post
    const mentionRegex = /@(\w+)/g
    const matches = [...(post.content.match(mentionRegex) || [])]
    const languagesMentioned = matches.map(match => match.substring(1).toLowerCase())

    if (languagesMentioned.length === 0) {
      console.log('No programming languages mentioned in this post')
      return new Response(
        JSON.stringify({ success: true, message: 'No programming languages to notify about' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
          status: 200 
        }
      )
    }

    console.log(`Languages mentioned in post: ${languagesMentioned.join(', ')}`)

    // Get all users with emails and programming languages
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, programming_languages, email')
      .not('email', 'is', null)
      .eq('email_notifications_enabled', true) // Only notify users who have enabled email notifications
      .not('user_id', 'eq', post.user_id) // Don't notify the author

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`Found ${users?.length || 0} users with email notifications enabled`)

    // Process notifications
    let notificationsSent = 0

    // Process each user
    for (const user of users || []) {
      try {
        // Skip users without programming languages
        if (!user.programming_languages || !Array.isArray(user.programming_languages) || user.programming_languages.length === 0) {
          continue
        }

        // Find languages that match between the post and user's interests
        const userLanguages = user.programming_languages.map(lang => lang.toLowerCase())
        const relevantLanguages = languagesMentioned.filter(lang => 
          userLanguages.some(userLang => userLang.toLowerCase() === lang.toLowerCase())
        )

        if (relevantLanguages.length > 0) {
          console.log(`Found ${relevantLanguages.length} relevant languages for user ${user.user_id}`)
          
          const languageList = relevantLanguages.join(', ')
          
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
                subject: `New post about ${languageList}`,
                body: `There's a new post discussing ${languageList} on iBlue. Check it out and join the conversation!`,
                postId: post.id,
                priority: immediate ? 'high' : 'normal' // Add priority flag for immediate processing
              }),
            }
          )

          if (!response.ok) {
            console.error(`Failed to send email notification to user ${user.user_id}:`, await response.text())
          } else {
            console.log(`Successfully sent email notification to user ${user.user_id} about post ${post.id}`)
            notificationsSent++
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Language notifications processed. Sent ${notificationsSent} notifications.` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Error in send-language-notifications:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process notifications: ' + error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

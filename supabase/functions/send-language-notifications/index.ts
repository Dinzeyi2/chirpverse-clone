
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.36.0'

serve(async (req) => {
  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Starting language notification process')

    // Get all users who have consented to notifications
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select('user_id, programming_languages')
      .contains('user_metadata', { notifications_consent: true })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch users' }),
        { status: 500 }
      )
    }

    console.log(`Found ${users?.length || 0} users with notification consent`)

    // Get recent posts (last 24 hours)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: recentPosts, error: postsError } = await supabaseClient
      .from('shoutouts')
      .select('id, content, created_at, user_id')
      .gt('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('Error fetching recent posts:', postsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch recent posts' }),
        { status: 500 }
      )
    }

    console.log(`Found ${recentPosts?.length || 0} recent posts`)

    // Process each user
    for (const user of users || []) {
      try {
        // Skip users without programming languages
        if (!user.programming_languages || !Array.isArray(user.programming_languages) || user.programming_languages.length === 0) {
          continue
        }

        // Find posts mentioning user's languages
        const userLanguages = user.programming_languages.map(lang => lang.toLowerCase())
        const relevantPosts = recentPosts?.filter(post => {
          const content = post.content.toLowerCase()
          return userLanguages.some(lang => content.includes(lang.toLowerCase()))
        })

        if (relevantPosts && relevantPosts.length > 0) {
          console.log(`Found ${relevantPosts.length} relevant posts for user ${user.user_id}`)

          // Call the send-push-notification function
          const response = await fetch(
            `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              },
              body: JSON.stringify({
                userId: user.user_id,
                title: 'New content about your languages',
                body: `There are ${relevantPosts.length} new posts about languages you follow`,
                url: '/',
                tag: 'language-updates'
              }),
            }
          )

          if (!response.ok) {
            console.error(`Failed to send notification to user ${user.user_id}:`, await response.text())
          }
        }
      } catch (userError) {
        console.error(`Error processing user ${user.user_id}:`, userError)
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Language notifications processed' }),
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in send-language-notifications:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process notifications' }),
      { status: 500 }
    )
  }
})

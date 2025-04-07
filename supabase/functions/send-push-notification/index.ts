
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
    const { userId, title, body, url, tag } = await req.json()
    console.log('Notification request:', { userId, title, body, url, tag })

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required userId parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get the user's push subscription
    const { data: subscriptionData, error: fetchError } = await supabaseClient
      .from('user_push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Error fetching user subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    if (!subscriptionData || !subscriptionData.subscription) {
      console.error('No subscription found for user:', userId)
      return new Response(
        JSON.stringify({ error: 'No subscription found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Parse the subscription
    let subscription;
    try {
      subscription = JSON.parse(subscriptionData.subscription)
      console.log('Found subscription:', subscription)
    } catch (parseError) {
      console.error('Error parsing subscription:', parseError)
      return new Response(
        JSON.stringify({ error: 'Invalid subscription format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Prepare notification payload
    const notificationPayload = {
      title: title || 'iblue Notification',
      body: body || 'You have a new notification',
      icon: '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png',
      badge: '/lovable-uploads/6cd6103f-8ab6-49f9-b4cc-8d47775646bd.png',
      data: {
        url: url || '/',
      },
      tag: tag || 'iblue-notification',
    }

    // Get VAPID public key from environment or use hardcoded value for testing
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
    
    // Use hardcoded VAPID private key
    const vapidPrivateKey = 'oCM1aK-uPu7mgypdGtVvJio3zi3xInZfzedCMjGA69Y';
    
    console.log('Using VAPID public key:', vapidPublicKey)

    // VAPID keys
    const vapidKeys = {
      publicKey: vapidPublicKey,
      privateKey: vapidPrivateKey,
      subject: 'mailto:' + (Deno.env.get('VAPID_SUBJECT') || 'contact@i-blue.dev')
    }

    // Use the web-push library
    const webPush = await import('https://esm.sh/web-push@3.5.0')

    try {
      // Set VAPID details
      webPush.setVapidDetails(
        vapidKeys.subject,
        vapidKeys.publicKey,
        vapidKeys.privateKey
      )
    } catch (vapidError) {
      console.error('Error setting VAPID details:', vapidError)
      return new Response(
        JSON.stringify({ error: 'Error setting VAPID details: ' + vapidError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Send the notification
    try {
      console.log('Sending notification with payload:', notificationPayload)
      const result = await webPush.sendNotification(
        subscription,
        JSON.stringify(notificationPayload)
      )

      console.log('Push notification sent successfully:', result)

      return new Response(
        JSON.stringify({ success: true, message: 'Notification sent successfully' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (pushError) {
      console.error('Push service error:', pushError)
      
      // Check if subscription is expired
      if (pushError.statusCode === 410) {
        // Subscription has expired or is no longer valid
        console.log('Subscription is no longer valid, removing it from database')
        await supabaseClient
          .from('user_push_subscriptions')
          .delete()
          .eq('user_id', userId)
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Push service error', 
          details: pushError.message,
          statusCode: pushError.statusCode
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
  } catch (error) {
    console.error('Error sending push notification:', error)
    
    return new Response(
      JSON.stringify({ error: 'Failed to send notification: ' + error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

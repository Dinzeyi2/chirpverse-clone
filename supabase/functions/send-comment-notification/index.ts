
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.36.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    console.log("Starting send-comment-notification function...");
    
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse the request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log("Request body:", JSON.stringify(requestBody));
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }
    
    const { 
      postId, 
      postAuthorId, 
      commenterId, 
      commenterName,
      commentContent,
      skipEmailIfActive = false 
    } = requestBody;

    if (!postId || !postAuthorId || !commenterId) {
      console.error("Missing required parameters");
      return new Response(
        JSON.stringify({ error: "Missing required parameters: postId, postAuthorId, or commenterId" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Don't send notification to yourself
    if (postAuthorId === commenterId) {
      console.log("Skipping notification as the commenter is the post author");
      return new Response(
        JSON.stringify({ message: "Skipped notification as user commented on their own post" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get post author details
    const { data: postAuthor, error: authorError } = await supabaseClient
      .from("profiles")
      .select("email_notifications_enabled, full_name")
      .eq("user_id", postAuthorId)
      .single();

    if (authorError) {
      console.error("Error fetching post author profile:", authorError);
      return new Response(
        JSON.stringify({ error: "Error fetching post author profile", details: authorError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (postAuthor?.email_notifications_enabled === false) {
      console.log("Email notifications are disabled for the post author");
      return new Response(
        JSON.stringify({ message: "Email notifications are disabled for the post author" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Get post author's email from auth.users
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(postAuthorId);
    
    if (authError || !authUser || !authUser.user || !authUser.user.email) {
      console.error("Error fetching post author auth details:", authError);
      return new Response(
        JSON.stringify({ error: "Error fetching post author email", details: authError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const authorEmail = authUser.user.email;
    
    // Get post details to include in the notification
    const { data: postData, error: postError } = await supabaseClient
      .from("shoutouts")
      .select("content")
      .eq("id", postId)
      .single();

    if (postError) {
      console.error("Error fetching post details:", postError);
      return new Response(
        JSON.stringify({ error: "Error fetching post details", details: postError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Check if user is currently active (if skipEmailIfActive is true)
    if (skipEmailIfActive) {
      console.log("Checking if user is currently active in the app...");
      
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { data: activeUsers, error: activeError } = await supabaseClient
        .from("user_sessions")
        .select("last_active")
        .eq("user_id", postAuthorId)
        .gte("last_active", fiveMinutesAgo)
        .limit(1);
      
      if (!activeError && activeUsers && activeUsers.length > 0) {
        console.log(`User ${postAuthorId} is currently active in the app. Skipping email notification.`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: "Email notification skipped for active user",
            active: true 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // Prepare email content
    const appUrl = Deno.env.get("APP_URL") || "https://i-blue.dev";
    const postUrl = `${appUrl}/post/${postId}`;
    
    // Truncate comment and post content for the email
    const truncatedComment = commentContent.length > 100 
      ? `${commentContent.substring(0, 100)}...` 
      : commentContent;
    
    const truncatedPostContent = postData.content.length > 100 
      ? `${postData.content.substring(0, 100)}...` 
      : postData.content;

    const emailSubject = `New comment from ${commenterName}`;
    const emailBody = `${commenterName} commented on your post: "${truncatedComment}"

Your post: "${truncatedPostContent}"

Click the button below to view the comment and reply.`;

    // Call the existing email notification function
    const emailResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-email-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          userId: postAuthorId,
          subject: emailSubject,
          body: emailBody,
          postId: postId,
          skipEmailIfActive: skipEmailIfActive,
        }),
      }
    );

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Error from email notification service:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to send email notification", details: errorText }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const emailResult = await emailResponse.json();
    console.log("Email notification sent:", emailResult);

    // Create an in-app notification
    const { error: notificationError } = await supabaseClient
      .from("notifications")
      .insert({
        type: "comment",
        sender_id: commenterId,
        recipient_id: postAuthorId,
        content: `${commenterName} commented on your post`,
        metadata: {
          post_id: postId,
          comment_content: truncatedComment
        }
      });

    if (notificationError) {
      console.error("Error creating in-app notification:", notificationError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Comment notification sent successfully",
        emailResult: emailResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in send-comment-notification function:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to send comment notification: " + error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

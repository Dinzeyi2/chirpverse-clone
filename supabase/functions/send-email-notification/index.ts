
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'https://esm.sh/resend@3.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders,
      status: 204
    })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    
    const resend = new Resend(resendApiKey);
    
    const { userId, subject, body, postId, priority = 'normal', actionUrl, actionText, debug = false } = await req.json();
    
    console.log(`Preparing email notification for userId ${userId}`);
    if (debug) {
      console.log('Email data:', { subject, body: body.substring(0, 100) + '...', postId, priority });
    }
    
    // Create a basic HTML version of the email with a button if actionUrl is provided
    let htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .content { margin-bottom: 30px; white-space: pre-line; }
            .button { display: inline-block; background-color: #2563eb; color: white; text-decoration: none; padding: 10px 20px; border-radius: 4px; font-weight: bold; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>iBlue</h1>
            </div>
            <div class="content">
              ${body.replace(/\n/g, '<br/>')}
            </div>
    `;
    
    if (actionUrl && actionText) {
      htmlContent += `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${actionUrl}" class="button">${actionText}</a>
            </div>
      `;
    }
    
    htmlContent += `
            <div class="footer">
              <p>This email was sent from your iBlue account.</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    const { data, error } = await resend.emails.send({
      from: 'iBlue <notifications@i-blue.dev>',
      to: [userId], // This will be replaced with the actual email in the webhook
      subject: subject,
      html: htmlContent,
      text: body
    });
    
    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }
    
    console.log('Email notification sent successfully:', data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification sent successfully',
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in send-email-notification function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Failed to send email notification',
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});

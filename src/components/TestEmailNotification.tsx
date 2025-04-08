
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { extractLanguageMentions } from '@/integrations/supabase/client';
import { AlertCircle, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TestEmailNotification = () => {
  const [loading, setLoading] = useState(false);
  const [testContent, setTestContent] = useState<string>("I'm working on a React and TypeScript project using Node.js and Express.");
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const { user } = useAuth();

  // Fetch the user's actual email on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email')
          .eq('user_id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user email:', error);
          return;
        }
        
        setUserEmail(data?.email || null);
      } catch (err) {
        console.error('Error in fetchUserProfile:', err);
      }
    };
    
    fetchUserProfile();
  }, [user]);

  const sendTestNotification = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }
    
    if (!userEmail) {
      toast({
        title: "No email found",
        description: "You don't have an email address in your profile. Please add one in your settings.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setTestResult(null);
    
    try {
      // Extract programming languages from the test content
      let languages: string[] = [];
      
      try {
        languages = extractLanguageMentions(testContent);
      } catch (langError: any) {
        setTestResult({
          success: false,
          message: `Error extracting languages: ${langError.message}`
        });
        toast({
          title: "Language detection error",
          description: langError.message,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      if (languages.length === 0) {
        setTestResult({
          success: false,
          message: "No programming languages detected in your text. Please mention some languages like JavaScript, Python, etc."
        });
        
        toast({
          title: "No languages detected",
          description: "Your test content doesn't mention any programming languages. Try adding some like JavaScript, Python, etc.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      toast({
        title: "Detected languages",
        description: `Found these languages: ${languages.join(', ')}`,
      });
      
      // Get user's email settings
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email, email_notifications_enabled')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) {
        throw new Error(`Failed to get user profile: ${profileError.message}`);
      }
      
      if (!profile.email) {
        setTestResult({
          success: false,
          message: "No email address found in your profile. Please add an email address in your profile settings."
        });
        
        toast({
          title: "No email address",
          description: "You need to add an email address to your profile to receive notifications.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      if (!profile.email_notifications_enabled) {
        setTestResult({
          success: false,
          message: "Email notifications are disabled in your profile. Please enable them using the switch above."
        });
        
        toast({
          title: "Notifications disabled",
          description: "You need to enable email notifications in your settings.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      // Create a test post
      const { data: post, error: postError } = await supabase
        .from('shoutouts')
        .insert({
          content: testContent,
          user_id: user.id
        })
        .select()
        .single();
        
      if (postError) {
        throw new Error(`Failed to create test post: ${postError.message}`);
      }
      
      // Call the notification function directly
      toast({
        title: "Processing",
        description: "Sending test notifications...",
      });
      
      console.log('Calling send-email-notification for direct test...');
      const emailResponse = await supabase.functions.invoke('send-email-notification', {
        body: {
          userId: user.id,
          subject: `TEST - Notification for languages: ${languages.join(', ')}`,
          body: `This is a TEST email notification for a post mentioning: ${languages.join(', ')}.\n\n"${testContent}"`,
          postId: post.id,
          priority: 'high',
          debug: true
        }
      });
      
      if (emailResponse.error) {
        throw new Error(`Error sending direct email: ${emailResponse.error.message}`);
      }
      
      console.log('Direct email response:', emailResponse.data);
      
      // Also test the language notification system
      const { data, error } = await supabase.functions.invoke('send-language-notifications', {
        body: { 
          postId: post.id,
          languages,
          content: testContent,
          immediate: true,
          debug: true
        }
      });
      
      if (error) {
        throw new Error(`Error processing notifications: ${error.message}`);
      }
      
      console.log('Notification response:', data);
      
      setTestResult({
        success: true,
        message: `Test email sent to ${profile.email}. It may take a few minutes to arrive.`
      });
      
      toast({
        title: "Test Complete",
        description: `Email sent to ${profile.email}. It may take a few minutes to arrive.`,
      });
      
    } catch (error: any) {
      console.error('Test notification error:', error);
      
      setTestResult({
        success: false,
        message: error.message || "Failed to send test notification"
      });
      
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 border rounded-md p-4 bg-card">
      <h3 className="text-lg font-medium">Test Email Notifications</h3>
      <p className="text-sm text-muted-foreground">
        Use this to test that your email notification system is working properly.
      </p>
      
      {userEmail && (
        <p className="text-sm">
          Emails will be sent to: <span className="font-medium">{userEmail}</span>
        </p>
      )}
      
      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{testResult.success ? "Test Sent" : "Test Failed"}</AlertTitle>
          <AlertDescription>
            {testResult.message}
          </AlertDescription>
        </Alert>
      )}
      
      <Textarea
        value={testContent}
        onChange={(e) => setTestContent(e.target.value)}
        placeholder="Write some content that mentions programming languages..."
        className="min-h-[100px]"
      />
      
      <p className="text-xs text-muted-foreground">
        Make sure to mention programming languages like JavaScript, Python, React, etc. to trigger language-based notifications.
      </p>
      
      <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          For this test to work, make sure:
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>You have an email address in your profile</li>
            <li>Email notifications are enabled (toggle above)</li>
            <li>You've added programming languages to your profile</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Button 
        onClick={sendTestNotification} 
        disabled={loading || !testContent.trim() || !userEmail}
        className="w-full"
      >
        {loading ? "Sending..." : "Send Test Notification"}
      </Button>
    </div>
  );
};

export default TestEmailNotification;

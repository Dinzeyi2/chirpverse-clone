
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import { extractLanguageMentions } from '@/integrations/supabase/client';

const TestEmailNotification = () => {
  const [loading, setLoading] = useState(false);
  const [testContent, setTestContent] = useState<string>("I'm working on a React and TypeScript project using Node.js and Express.");
  const { user } = useAuth();

  const sendTestNotification = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "You must be logged in to test notifications",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    try {
      // Extract programming languages from the test content
      const languages = extractLanguageMentions(testContent);
      
      if (languages.length === 0) {
        toast({
          title: "No languages detected",
          description: "Your test content doesn't mention any programming languages. Try adding some like JavaScript, Python, etc.",
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Detected languages",
        description: `Found these languages: ${languages.join(', ')}`,
      });
      
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
      
      toast({
        title: "Test Complete",
        description: `Processed ${data.stats?.notifications_sent || 0} notifications for ${languages.length} languages.`,
      });
      
    } catch (error: any) {
      console.error('Test notification error:', error);
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
      
      <Textarea
        value={testContent}
        onChange={(e) => setTestContent(e.target.value)}
        placeholder="Write some content that mentions programming languages..."
        className="min-h-[100px]"
      />
      
      <p className="text-xs text-muted-foreground">
        Make sure to mention programming languages like JavaScript, Python, React, etc. to trigger language-based notifications.
      </p>
      
      <Button 
        onClick={sendTestNotification} 
        disabled={loading || !testContent.trim()}
      >
        {loading ? "Sending..." : "Send Test Notification"}
      </Button>
    </div>
  );
};

export default TestEmailNotification;

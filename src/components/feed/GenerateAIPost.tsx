
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GenerateAIPostProps {
  onPostGenerated: (content: string) => void;
}

const GenerateAIPost: React.FC<GenerateAIPostProps> = ({ onPostGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);
  const [isAutomationEnabled, setIsAutomationEnabled] = useState(false);

  // Function to generate a random interval between 5-8 minutes in milliseconds
  const getRandomInterval = (): number => {
    return (Math.floor(Math.random() * (8 - 5 + 1)) + 5) * 60 * 1000;
  };

  // Subscribe to real-time updates for the shoutouts table
  useEffect(() => {
    const channel = supabase
      .channel('shoutouts-changes')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'shoutouts',
          filter: 'metadata->is_ai_generated=eq.true'
        }, 
        (payload) => {
          console.log('New AI-generated post detected:', payload);
          
          if (payload.new && payload.new.content) {
            // Fetch the complete post data
            supabase
              .from('shoutouts')
              .select('content, media, metadata')
              .eq('id', payload.new.id)
              .single()
              .then(({ data, error }) => {
                if (error) {
                  console.error('Error fetching new post details:', error);
                  return;
                }
                
                if (data) {
                  // Pass the generated content to parent component for immediate display
                  onPostGenerated(data.content);
                  toast.success('New AI post detected and added to your feed!');
                }
              });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onPostGenerated]);

  // Check if server-side automation is enabled
  useEffect(() => {
    const checkAutomationStatus = async () => {
      try {
        // Call setup-cron function to ensure server-side automation is running
        const { data, error } = await supabase.functions.invoke('setup-cron');
        
        if (error) {
          console.error('Error checking automation status:', error);
        } else {
          console.log('Automation status:', data);
          if (data?.success) {
            setIsAutomationEnabled(true);
            toast.success('Automatic post generation is active on the server! Posts will continue to be generated even when you are offline.');
          }
        }
      } catch (err) {
        console.error('Error checking automation status:', err);
      }
    };
    
    checkAutomationStatus();
  }, []);

  const generatePost = async () => {
    if (isGenerating) return; // Prevent multiple simultaneous generations
    
    setIsGenerating(true);
    toast.info('Looking for real developer questions...');
    
    try {
      // Call our edge function directly
      const { data, error } = await supabase.functions.invoke('auto-generate-post');
      
      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }
      
      if (data?.postId) {
        // Get the newly created post
        const { data: post, error: fetchError } = await supabase
          .from('shoutouts')
          .select('content')
          .eq('id', data.postId)
          .single();
          
        if (fetchError) {
          console.error('Error fetching new post:', fetchError);
          throw fetchError;
        }
        
        // For frontend optimistic update - pass the generated content to parent
        if (post?.content) {
          onPostGenerated(post.content);
        }
        
        toast.success('Found a developer question and posted it!');
        setLastGenerated(new Date());
      } else {
        toast.info('No new post was generated. Please try again later.');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error(`Failed to generate post: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Set up automatic generation based on an interval
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const scheduleNextGeneration = () => {
      const interval = getRandomInterval();
      console.log(`Scheduling next post generation in ${interval / 60000} minutes`);
      
      timeoutId = setTimeout(() => {
        generatePost().then(() => {
          scheduleNextGeneration();
        });
      }, interval);
    };

    // Start the cycle
    scheduleNextGeneration();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <Button
      onClick={generatePost}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      title={isAutomationEnabled ? "Posts are also automatically generated every 5-8 minutes even when you're offline" : "Generate AI questions"}
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Brain className="h-4 w-4" />
      )}
      Find Questions
    </Button>
  );
};

export default GenerateAIPost;

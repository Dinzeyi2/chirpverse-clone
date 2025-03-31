
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface GenerateAIPostProps {
  onPostGenerated: (content: string) => void;
}

const GenerateAIPost: React.FC<GenerateAIPostProps> = ({ onPostGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastChecked, setLastChecked] = useState(Date.now());
  const [isAutoPostEnabled] = useState(true);

  // Initialize realtime subscriptions to make posts appear without refresh
  useEffect(() => {
    if (!isAutoPostEnabled) return;
    
    // Set up realtime subscriptions to Supabase for shoutouts table
    const channel = supabase
      .channel('public:shoutouts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'shoutouts',
        filter: `user_id=eq.513259a2-555a-4c73-8ce5-db537e33b546`
      }, payload => {
        console.log('New AI post received via realtime:', payload);
        
        if (payload.new && 
            payload.new.content && 
            payload.new.metadata && 
            payload.new.metadata.is_ai_generated) {
          
          // This will update the UI with the new post
          onPostGenerated(payload.new.content);
          toast.success("New coding question posted!");
        }
      })
      .subscribe();
      
    console.log("Realtime subscription for new AI posts activated");
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onPostGenerated, isAutoPostEnabled]);
  
  // Check if we need to explicitly enable or configure realtime
  useEffect(() => {
    const enableRealtime = async () => {
      try {
        await supabase.realtime.setAuth(await supabase.auth.getSession().then(res => res.data.session?.access_token || ''));
        console.log("Realtime auth set successfully");
      } catch (error) {
        console.error("Error setting realtime auth:", error);
      }
    };
    
    enableRealtime();
  }, []);
  
  // Trigger auto post generation if we haven't seen a new post in a while
  useEffect(() => {
    if (!isAutoPostEnabled) return;
    
    const checkAndTriggerPostGeneration = async () => {
      try {
        // Get the most recent AI-generated post
        const { data: lastPosts, error } = await supabase
          .from('shoutouts')
          .select('created_at, metadata')
          .eq('user_id', '513259a2-555a-4c73-8ce5-db537e33b546')
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (lastPosts && lastPosts.length > 0) {
          const lastPost = lastPosts[0];
          const lastPostDate = new Date(lastPost.created_at);
          
          console.log(`Last AI post was at ${lastPostDate.toLocaleTimeString()}`);
          
          const currentTime = new Date();
          const timeSinceLastPost = currentTime.getTime() - lastPostDate.getTime();
          const minutesSinceLastPost = timeSinceLastPost / (1000 * 60);
          
          console.log(`${minutesSinceLastPost.toFixed(1)} minutes since last post`);
          
          // If it's been more than 9 minutes, manually trigger a new post
          if (minutesSinceLastPost > 9 && !isGenerating) {
            console.log("It's been too long since the last post, triggering generation");
            await generatePost(true);
          }
        }
        
        setLastChecked(Date.now());
      } catch (err) {
        console.error("Error checking for recent posts:", err);
      }
    };
    
    // Check for recent posts every 3 minutes
    const intervalId = setInterval(checkAndTriggerPostGeneration, 3 * 60 * 1000);
    
    // Check immediately on component mount
    checkAndTriggerPostGeneration();
    
    return () => {
      clearInterval(intervalId);
    };
  }, [isAutoPostEnabled, isGenerating]);
  
  const generateRandomBlueUsername = (): string => {
    const adjectives = ['cool', 'super', 'awesome', 'coding', 'dev', 'tech', 'data', 'web', 'pro', 'smart'];
    const nouns = ['coder', 'dev', 'builder', 'creator', 'ninja', 'guru', 'hacker', 'wizard', 'expert', 'geek'];
    
    if (Math.random() > 0.5) {
      const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const noun = nouns[Math.floor(Math.random() * nouns.length)];
      const num = Math.floor(Math.random() * 1000);
      return `blue${adj}${noun}${num}`;
    } else {
      const randomNum = Math.floor(1000 + Math.random() * 90000).toString();
      return `blue${randomNum}`;
    }
  };

  const checkForDuplicateContent = async (content: string): Promise<boolean> => {
    try {
      const { data: existingPosts, error } = await supabase
        .from('shoutouts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error checking for duplicate content:', error);
        return false;
      }
      
      return existingPosts.some(post => 
        post.content.toLowerCase().trim() === content.toLowerCase().trim()
      );
    } catch (error) {
      console.error('Error in duplicate check:', error);
      return false;
    }
  };

  const generatePost = async (isAutomatic: boolean = false) => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    
    if (!isAutomatic) {
      toast.info('Looking for real developer questions...');
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You need to be logged in to generate AI posts");
      }
      
      let attempts = 0;
      let content = null;
      let isDuplicate = false;
      let errorMessage = null;
      
      while (attempts < 3 && !content) {
        attempts++;
        
        try {
          const { data, error } = await supabase.functions.invoke('generate-coding-post', {
            body: { autoGenerated: isAutomatic }
          });
          
          if (error) {
            errorMessage = error.message;
            console.error('Error from edge function:', error);
            continue;
          }
          
          if (data?.content) {
            isDuplicate = await checkForDuplicateContent(data.content);
            
            if (!isDuplicate) {
              content = data.content;
            } else {
              console.log('Duplicate content found, trying again...');
              continue;
            }
          }
        } catch (err) {
          console.error('Error during attempt:', err);
          errorMessage = err.message;
        }
      }
      
      if (!content) {
        if (isDuplicate) {
          throw new Error('Could not generate a unique post after multiple attempts');
        } else if (errorMessage) {
          throw new Error(`API error: ${errorMessage}`);
        } else {
          throw new Error('No content was generated');
        }
      }
      
      const blue5146UserId = '513259a2-555a-4c73-8ce5-db537e33b546';
      
      const displayUsername = generateRandomBlueUsername();
      
      console.log(`Generated random username: ${displayUsername}`);
      
      const { data: insertedPost, error: insertError } = await supabase
        .from('shoutouts')
        .insert({
          content: content,
          user_id: blue5146UserId,
          metadata: {
            display_username: displayUsername,
            is_ai_generated: true
          }
        })
        .select('id')
        .single();
        
      if (insertError) {
        console.error('Error inserting AI post:', insertError);
        throw new Error('Failed to save the generated post to the database');
      }
      
      console.log('Successfully inserted AI post:', insertedPost);
      
      // Call onPostGenerated to update the UI with the new post
      onPostGenerated(content);
      
      if (!isAutomatic) {
        toast.success('Found a developer question and posted it!');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      
      if (!isAutomatic) {
        toast.error(`Failed to generate post: ${error.message}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={() => generatePost(false)}
      disabled={isGenerating}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
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


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

  // Function to generate a random interval between 5-8 minutes in milliseconds
  const getRandomInterval = (): number => {
    return (Math.floor(Math.random() * (8 - 5 + 1)) + 5) * 60 * 1000;
  };

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

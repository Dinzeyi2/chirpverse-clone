
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface GenerateAIPostProps {
  onPostGenerated: (content: string) => void;
}

const GenerateAIPost: React.FC<GenerateAIPostProps> = ({ onPostGenerated }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePost = async () => {
    if (isGenerating) return; // Prevent multiple simultaneous generations
    
    setIsGenerating(true);
    toast.info('Looking for real developer questions...');
    
    try {
      // Get current user to check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You need to be logged in to generate AI posts");
      }
      
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

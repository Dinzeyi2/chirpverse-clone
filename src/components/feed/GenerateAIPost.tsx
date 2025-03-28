
import React, { useState } from 'react';
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

  // Generate a fake user ID for AI users with proper UUID format
  const generateFakeUserId = () => {
    return uuidv4();
  };
  
  // Generate a display username in the "blue1234" format
  const generateDisplayUsername = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `blue${randomDigits}`;
  };

  const generatePost = async () => {
    setIsGenerating(true);
    toast.info('Finding real coding issues from the web...');
    
    try {
      // Get current user to check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You need to be logged in to generate AI posts");
      }
      
      // Call our edge function to generate a post with real content from the web
      const { data, error } = await supabase.functions.invoke('generate-coding-post');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.content) {
        // For frontend optimistic update - pass the generated content to parent
        onPostGenerated(data.content);
        
        // We no longer need to insert directly into the database
        // The parent component will handle that through normal post creation flow
        toast.success('Real coding issue found and posted!');
      } else {
        throw new Error('No content was found');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('Failed to generate post. Please try again.');
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
      Find Real Coding Issues
    </Button>
  );
};

export default GenerateAIPost;

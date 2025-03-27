
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
    setIsGenerating(true);
    toast.info('Generating AI post...');
    
    try {
      // Call our edge function to generate a post
      const { data, error } = await supabase.functions.invoke('generate-coding-post');
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.content) {
        // Post the generated content
        onPostGenerated(data.content);
        toast.success('AI post generated successfully!');
      } else {
        throw new Error('No content was generated');
      }
    } catch (error) {
      console.error('Error generating post:', error);
      toast.error('Failed to generate AI post. Please try again.');
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
      Generate AI Post
    </Button>
  );
};

export default GenerateAIPost;

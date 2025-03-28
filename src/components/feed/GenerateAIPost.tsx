
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
    // Create a proper UUID for the database
    return uuidv4();
  };
  
  // Generate a display username in the "blue1234" format
  const generateDisplayUsername = () => {
    // Generate random 4 digits
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `blue${randomDigits}`;
  };

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
        // Create a proper UUID for the database
        const fakeUserId = generateFakeUserId();
        const displayUsername = generateDisplayUsername();
        
        // Create a new post in Supabase with the fake user ID
        const postId = uuidv4();
        const { error: postError } = await supabase
          .from('shoutouts')
          .insert({
            id: postId,
            content: data.content,
            user_id: fakeUserId, // Use proper UUID
            created_at: new Date().toISOString(),
            metadata: {
              display_username: displayUsername // Store the display username in metadata
            }
          });
        
        if (postError) {
          console.error('Error creating post:', postError);
          throw new Error(postError.message);
        }
        
        // Pass the generated content to the parent component
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

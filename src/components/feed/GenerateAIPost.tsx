
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

  const checkForDuplicateContent = async (content: string): Promise<boolean> => {
    try {
      // Check last 50 posts to see if this content already exists
      const { data: existingPosts, error } = await supabase
        .from('shoutouts')
        .select('content')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) {
        console.error('Error checking for duplicate content:', error);
        return false;
      }
      
      // Check if the content already exists
      return existingPosts.some(post => 
        post.content.toLowerCase().trim() === content.toLowerCase().trim()
      );
    } catch (error) {
      console.error('Error in duplicate check:', error);
      return false;
    }
  };

  // Generate a unique random blue username
  const generateRandomBlueUsername = (): string => {
    // Generate a random 4-digit number between 1000 and 9999
    const randomNum = Math.floor(1000 + Math.random() * 9000).toString();
    return `blue${randomNum}`;
  };

  const generatePost = async () => {
    setIsGenerating(true);
    toast.info('Looking for real developer questions...');
    
    try {
      // Get current user to check authentication
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("You need to be logged in to generate AI posts");
      }
      
      // Try up to 3 times to get a unique post
      let attempts = 0;
      let content = null;
      let isDuplicate = false;
      let errorMessage = null;
      
      while (attempts < 3 && !content) {
        attempts++;
        
        try {
          // Call our edge function to generate a post with real content from the web
          const { data, error } = await supabase.functions.invoke('generate-coding-post');
          
          if (error) {
            errorMessage = error.message;
            console.error('Error from edge function:', error);
            continue; // Try again on error
          }
          
          if (data?.content) {
            // Check if this content is a duplicate
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
      
      // Set the fixed user ID for blue5146 - make sure all AI posts belong to this specific user
      const blue5146UserId = '513259a2-555a-4c73-8ce5-db537e33b546';
      
      // Generate a unique username that starts with "blue"
      const displayUsername = generateRandomBlueUsername();
      
      // Insert the post directly into the database to ensure persistence
      const { error: insertError } = await supabase
        .from('shoutouts')
        .insert({
          content: content,
          user_id: blue5146UserId, // Always use the fixed user ID for blue5146
          metadata: {
            display_username: displayUsername, // Random "blue" username for each post
            is_ai_generated: true
          }
        });
        
      if (insertError) {
        console.error('Error inserting AI post:', insertError);
        throw new Error('Failed to save the generated post to the database');
      }
      
      // For frontend optimistic update - pass the generated content to parent
      onPostGenerated(content);
      
      toast.success('Found a developer question and posted it!');
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

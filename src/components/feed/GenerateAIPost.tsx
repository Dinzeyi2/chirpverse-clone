
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

  // Add emoji reactions to a post
  const addRandomEmojiReactions = async (postId: string) => {
    try {
      console.log('Adding random emoji reactions to post:', postId);
      
      // Common emoji reactions
      const emojiOptions = ['👍', '❤️', '🔥', '👏', '😄', '🚀', '💯', '🙌', '👌', '😎'];
      
      // Generate 2-5 random emoji reactions
      const numberOfReactions = Math.floor(Math.random() * 4) + 2;
      const selectedEmojis = [];
      
      // Set up the fixed blue user ID for AI-generated content
      const blue5146UserId = '513259a2-555a-4c73-8ce5-db537e33b546';
      
      for (let i = 0; i < numberOfReactions; i++) {
        // Pick a random emoji that hasn't been selected yet
        let emoji;
        do {
          emoji = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
        } while (selectedEmojis.includes(emoji));
        
        selectedEmojis.push(emoji);
        
        // Generate 1-3 reactions for each emoji
        const reactionCount = Math.floor(Math.random() * 3) + 1;
        
        for (let j = 0; j < reactionCount; j++) {
          const { error } = await supabase
            .from('post_reactions')
            .insert({
              post_id: String(postId),
              user_id: blue5146UserId,
              emoji: emoji
            });
            
          if (error) {
            console.error('Error adding emoji reaction:', error);
          } else {
            console.log(`Added emoji reaction ${emoji} to post ${postId}`);
          }
          
          // Add a small delay between reactions
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Added ${selectedEmojis.length} types of emoji reactions to post ${postId}`);
      
    } catch (err) {
      console.error('Error adding emoji reactions:', err);
    }
  };

  // Add AI comments to the generated post
  const addAIComments = async (postId: string, postContent: string, blueUserId: string) => {
    try {
      console.log('Generating AI comments for post:', postId);
      // Call our edge function to generate AI comments
      const { data, error } = await supabase.functions.invoke('generate-ai-comment', {
        body: { postContent }
      });
      
      if (error) {
        console.error('Error generating AI comments:', error);
        // Fallback to local comment generation if edge function fails
        await addFallbackComments(postId, postContent, blueUserId);
        return;
      }
      
      if (!data?.comments || data.comments.length === 0) {
        console.log('No AI comments were generated, using fallback');
        await addFallbackComments(postId, postContent, blueUserId);
        return;
      }
      
      console.log('Generated AI comments:', data.comments);
      
      // Add each comment with a random AI username
      for (const commentContent of data.comments) {
        const displayUsername = generateRandomBlueUsername();
        
        // Add a small delay between comments to make them appear more natural
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .insert({
            content: commentContent,
            user_id: blueUserId,  // Use the same blue user ID for consistency
            shoutout_id: postId,
            metadata: {
              display_username: displayUsername,
              is_ai_generated: true
            }
          })
          .select('*')
          .single();
          
        if (commentError) {
          console.error('Error adding AI comment:', commentError);
          continue;
        }
        
        console.log(`Added AI comment from ${displayUsername}:`, commentData);
      }
      
      toast.success(`${data.comments.length} developers replied to the question!`);
      
    } catch (err) {
      console.error('Error adding AI comments:', err);
      // Try fallback if main method fails
      await addFallbackComments(postId, postContent, blueUserId);
    }
  };

  // Fallback comment generation if the edge function fails
  const addFallbackComments = async (postId: string, postContent: string, blueUserId: string) => {
    try {
      // Simple hardcoded fallback comments
      const fallbackComments = [
        "Have you tried clearing your cache?",
        "I ran into this same issue last week. Try checking your console for errors.",
        "Maybe there's a syntax error somewhere?",
        "Works fine on my machine! 😅",
        "Have you checked the documentation?",
        "That's interesting. What version are you using?",
        "I'd recommend checking Stack Overflow for similar issues.",
        "Try updating to the latest version, it might be fixed already."
      ];
      
      // Pick 2-4 random comments
      const numberOfComments = Math.floor(Math.random() * 3) + 2;
      const selectedComments = [];
      
      for (let i = 0; i < numberOfComments; i++) {
        // Pick a random comment that hasn't been selected yet
        let comment;
        do {
          comment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
        } while (selectedComments.includes(comment));
        
        selectedComments.push(comment);
        
        const displayUsername = generateRandomBlueUsername();
        
        // Add a small delay between comments
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .insert({
            content: comment,
            user_id: blueUserId,
            shoutout_id: postId,
            metadata: {
              display_username: displayUsername,
              is_ai_generated: true
            }
          })
          .select('*')
          .single();
          
        if (commentError) {
          console.error('Error adding fallback comment:', commentError);
          continue;
        }
        
        console.log(`Added fallback comment from ${displayUsername}:`, commentData);
      }
      
      toast.success(`${selectedComments.length} developers replied to the question!`);
      
    } catch (err) {
      console.error('Error adding fallback comments:', err);
    }
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
      
      console.log(`Generated random username: ${displayUsername}`);
      
      // Insert the post directly into the database to ensure persistence
      const { data: insertedPost, error: insertError } = await supabase
        .from('shoutouts')
        .insert({
          content: content,
          user_id: blue5146UserId, // Always use the fixed user ID for blue5146
          metadata: {
            display_username: displayUsername, // Random "blue" username for each post
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
      
      // Generate and add AI comments to the post
      if (insertedPost?.id) {
        // First add comments 
        await addAIComments(insertedPost.id, content, blue5146UserId);
        
        // Then add emoji reactions
        await addRandomEmojiReactions(insertedPost.id);
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

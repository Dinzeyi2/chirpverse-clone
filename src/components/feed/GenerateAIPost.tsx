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
  const [autoPostEnabled, setAutoPostEnabled] = useState(true);
  const [nextPostTime, setNextPostTime] = useState<Date | null>(null);
  const [lastPostedTime, setLastPostedTime] = useState<Date | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const blue5146UserId = '513259a2-555a-4c73-8ce5-db537e33b546';

  const getRandomInterval = () => {
    return Math.floor(Math.random() * (480000 - 300000 + 1)) + 300000;
  };

  useEffect(() => {
    console.log("Initializing AI auto-posting system");
    
    const initAutoPosting = async () => {
      try {
        const { data: lastPosts, error } = await supabase
          .from('shoutouts')
          .select('created_at, metadata')
          .eq('user_id', blue5146UserId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        if (lastPosts && lastPosts.length > 0) {
          const lastPost = lastPosts[0];
          const lastPostDate = new Date(lastPost.created_at);
          setLastPostedTime(lastPostDate);
          
          console.log(`Last AI post was at ${lastPostDate.toLocaleTimeString()}`);
          
          if (new Date().getTime() - lastPostDate.getTime() > 180000) {
            console.log("It's been more than 3 minutes since the last post, generating a new one now");
            generatePost();
          } else {
            const nextTime = new Date(lastPostDate.getTime() + getRandomInterval());
            setNextPostTime(nextTime);
            console.log(`Next post scheduled for ${nextTime.toLocaleTimeString()}`);
          }
        } else {
          console.log("No previous AI posts found, generating one now");
          generatePost();
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing auto-posting system:", error);
        const next = new Date(Date.now() + 30000);
        setNextPostTime(next);
        setIsInitialized(true);
      }
    };

    initAutoPosting();
    
    const autoPostInterval = setInterval(() => {
      console.log("Checking if it's time to create a new post...");
      console.log("Next scheduled post time:", nextPostTime?.toLocaleTimeString());
      
      if (nextPostTime && new Date() >= nextPostTime) {
        console.log("It's time to create a new post!");
        generatePost();
      }
    }, 10000);
    
    const backupInterval = setInterval(() => {
      console.log("Backup interval triggered - ensuring posts are being created");
      
      if (lastPostedTime) {
        const timeSince = new Date().getTime() - lastPostedTime.getTime();
        if (timeSince > 540000) {
          console.log("Backup system: It's been more than 9 minutes since last post, generating one now");
          generatePost();
        }
      } else {
        generatePost();
      }
    }, 480000);
    
    return () => {
      clearInterval(autoPostInterval);
      clearInterval(backupInterval);
    };
  }, []);

  useEffect(() => {
    if (!isInitialized || !nextPostTime) return;
    
    const checkTimer = setInterval(() => {
      if (new Date() >= nextPostTime) {
        console.log("Timer reached, generating post now");
        generatePost();
        clearInterval(checkTimer);
      }
    }, 1000);
    
    return () => clearInterval(checkTimer);
  }, [nextPostTime, isInitialized]);

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

  const addRandomEmojiReactions = async (postId: string) => {
    try {
      console.log('Adding random emoji reactions to post:', postId);
      
      const emojiOptions = ['👍', '❤️', '🔥', '👏', '😄', '🚀', '💯', '🙌', '👌', '😎'];
      
      const numberOfReactions = Math.floor(Math.random() * 23) + 7;
      const selectedEmojis = [];
      
      for (let i = 0; i < numberOfReactions; i++) {
        let emoji;
        do {
          emoji = emojiOptions[Math.floor(Math.random() * emojiOptions.length)];
        } while (selectedEmojis.includes(emoji));
        
        selectedEmojis.push(emoji);
        
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
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Added ${selectedEmojis.length} types of emoji reactions to post ${postId}`);
    } catch (err) {
      console.error('Error adding emoji reactions:', err);
    }
  };

  const addAIComments = async (postId: string, postContent: string, blueUserId: string) => {
    try {
      console.log('Generating AI comments for post:', postId);
      
      const commentsToGenerate = Math.floor(Math.random() * 26) + 15;
      
      const { data, error } = await supabase.functions.invoke('generate-ai-comment', {
        body: { 
          postContent,
          commentsCount: commentsToGenerate
        }
      });
      
      if (error) {
        console.error('Error generating AI comments:', error);
        await addFallbackComments(postId, postContent, blueUserId, commentsToGenerate);
        return;
      }
      
      if (!data?.comments || data.comments.length === 0) {
        console.log('No AI comments were generated, using fallback');
        await addFallbackComments(postId, postContent, blueUserId, commentsToGenerate);
        return;
      }
      
      console.log(`Generated ${data.comments.length} AI comments`);
      
      for (const commentData of data.comments) {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        const { data: commentData_, error: commentError } = await supabase
          .from('comments')
          .insert({
            content: commentData.content,
            user_id: blueUserId,
            shoutout_id: postId,
            metadata: {
              display_username: commentData.displayUsername,
              is_ai_generated: true,
              reactions: commentData.reactions
            }
          })
          .select('*')
          .single();
          
        if (commentError) {
          console.error('Error adding AI comment:', commentError);
          continue;
        }
        
        console.log(`Added AI comment from ${commentData.displayUsername}:`, commentData_);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await addCommentReactions(commentData_.id, blueUserId, commentData.reactions);
      }
      
      toast.success(`${data.comments.length} developers replied to the question!`);
    } catch (err) {
      console.error('Error adding AI comments:', err);
      await addFallbackComments(postId, postContent, blueUserId, Math.floor(Math.random() * 26) + 15);
    }
  };

  const addCommentReactions = async (commentId: string, userId: string, emojis: string[]) => {
    try {
      for (const emoji of emojis) {
        const reactionCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < reactionCount; i++) {
          const { error } = await supabase
            .from('comment_reactions')
            .insert({
              comment_id: commentId,
              user_id: userId,
              emoji: emoji
            });
            
          if (error) {
            console.error(`Error adding ${emoji} reaction to comment:`, error);
          } else {
            console.log(`Added ${emoji} reaction to comment ${commentId}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (err) {
      console.error('Error adding comment reactions:', err);
    }
  };

  const addFallbackComments = async (postId: string, postContent: string, blueUserId: string, commentCount = 24) => {
    try {
      const fallbackComments = [
        "Have you tried clearing your cache?",
        "I ran into this same issue last week. Try checking your console for errors.",
        "Maybe there's a syntax error somewhere?",
        "Works fine on my machine! 😅",
        "Have you checked the documentation?",
        "That's interesting. What version are you using?",
        "I'd recommend checking Stack Overflow for similar issues.",
        "Try updating to the latest version, it might be fixed already.",
        "Are all your dependencies up to date?",
        "Could be a browser compatibility issue. Which browser are you using?",
        "Did you try restarting your dev server?",
        "I think this is a known bug in the latest release.",
        "You might need to clear your browser cache and cookies.",
        "This seems like an environment variable problem to me.",
        "I had the same problem, turns out I misspelled a variable name!",
        "Check your network tab for any failed requests.",
        "Could be related to CORS settings on your server.",
        "Are you using the correct API endpoint?",
        "Double-check your authentication headers.",
        "Make sure your backend is actually running.",
        "I'd start by adding console logs to track the flow."
      ];
      
      const numberOfComments = Math.min(commentCount, fallbackComments.length);
      const selectedComments = [];
      
      for (let i = 0; i < numberOfComments; i++) {
        let comment;
        do {
          comment = fallbackComments[Math.floor(Math.random() * fallbackComments.length)];
        } while (selectedComments.includes(comment));
        
        selectedComments.push(comment);
        
        const displayUsername = generateRandomBlueUsername();
        
        const randomEmojis = ['👍', '❤️', '🔥', '🚀', '🙌'].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 300));
        
        const { data: commentData, error: commentError } = await supabase
          .from('comments')
          .insert({
            content: comment,
            user_id: blueUserId,
            shoutout_id: postId,
            metadata: {
              display_username: displayUsername,
              is_ai_generated: true,
              reactions: randomEmojis
            }
          })
          .select('*')
          .single();
          
        if (commentError) {
          console.error('Error adding fallback comment:', commentError);
          continue;
        }
        
        console.log(`Added fallback comment from ${displayUsername}:`, commentData);
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await addCommentReactions(commentData.id, blueUserId, randomEmojis);
      }
      
      toast.success(`${selectedComments.length} developers replied to the question!`);
    } catch (err) {
      console.error('Error adding fallback comments:', err);
    }
  };

  const generatePost = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    console.log("Starting to generate a new AI post");
    
    try {
      let attempts = 0;
      let content = null;
      let isDuplicate = false;
      let errorMessage = null;
      
      while (attempts < 3 && !content) {
        attempts++;
        
        try {
          console.log(`Attempt ${attempts} to generate content`);
          const { data, error } = await supabase.functions.invoke('generate-coding-post');
          
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
      
      const newInterval = getRandomInterval();
      const next = new Date(Date.now() + newInterval);
      setNextPostTime(next);
      setLastPostedTime(new Date());
      console.log(`Next automatic post scheduled for ${next.toLocaleTimeString()}`);
      
      if (insertedPost?.id) {
        await addAIComments(insertedPost.id, content, blue5146UserId);
        await addRandomEmojiReactions(insertedPost.id);
      }
      
      onPostGenerated(content);
      
      console.log("AI post generation completed successfully");
      toast.success('Found a developer question and posted it!');
    } catch (error) {
      console.error('Error generating post:', error);
      
      const next = new Date(Date.now() + 30000);
      setNextPostTime(next);
      
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

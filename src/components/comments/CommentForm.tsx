import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Send, Image, AtSign, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { CommentMetadata, MediaItem, ReplyTo } from '@/lib/data';
import { useQueryClient } from '@tanstack/react-query';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface CommentFormProps {
  postId: string;
  parentId?: string;
  replyTo?: ReplyTo;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
  autoFocus?: boolean;
  postAuthorId?: string;
  isReply?: boolean;
  placeholderText?: string;
  replyToMetadata?: {
    reply_to: { comment_id: string; username: string };
    parent_id: string;
  };
  onCommentAdded?: () => void;
  currentUser?: any;
}

const CommentForm = ({ 
  postId, 
  parentId, 
  replyTo, 
  onSuccess, 
  onCancel, 
  placeholder = "Write a comment...", 
  autoFocus = false,
  postAuthorId,
  isReply = false,
  placeholderText,
  replyToMetadata,
  onCommentAdded,
  currentUser
}: CommentFormProps) => {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast({
        title: "Empty comment",
        description: "Please add some content to your comment",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post a comment",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const metadata: CommentMetadata = {};
      
      if (replyTo) {
        metadata.reply_to = replyTo;
      } else if (replyToMetadata) {
        metadata.reply_to = replyToMetadata.reply_to;
        metadata.parent_id = replyToMetadata.parent_id;
      }
      
      if (parentId) {
        metadata.parent_id = parentId;
      }
      
      const { data: newComment, error } = await supabase
        .from('comments')
        .insert({
          content: comment,
          user_id: user.id,
          shoutout_id: postId,
          metadata
        })
        .select('*, user:profiles!inner(*)');
        
      if (error) {
        throw error;
      }

      if (postAuthorId && postAuthorId !== user.id) {
        try {
          const { data: commenterProfile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', user.id)
            .single();
          
          const commenterName = commenterProfile?.full_name || 'Someone';
          
          await supabase.functions.invoke('send-email-notification', {
            body: {
              userId: postAuthorId,
              subject: `${commenterName} commented on your post`,
              body: `${commenterName} commented: "${comment.substring(0, 100)}${comment.length > 100 ? '...' : ''}"`,
              postId: postId,
              priority: 'normal',
              skipEmailIfActive: true
            }
          });
          
          console.log('Comment notification email sent successfully');
        } catch (emailError) {
          console.error('Failed to send comment notification email:', emailError);
        }
      }
      
      setComment('');
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onCommentAdded) {
        onCommentAdded();
      }
      
      queryClient.invalidateQueries({
        queryKey: ['comments', postId],
      });
      
      queryClient.invalidateQueries({
        queryKey: ['post', postId],
      });
      
      toast({
        title: "Comment posted",
        description: "Your comment has been posted successfully",
      });
      
    } catch (error: any) {
      console.error("Error posting comment:", error);
      
      toast({
        title: "Failed to post comment",
        description: error.message || "There was an error posting your comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: { emoji: string }) => {
    setComment(prevComment => prevComment + emoji.emoji);
    setShowEmojiPicker(false);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setComment(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start space-x-3">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={user?.user_metadata?.avatar_url} 
                alt={user?.user_metadata?.full_name || user?.user_metadata?.username || 'User'} 
              />
              <AvatarFallback>{user?.user_metadata?.full_name?.[0] || 'U'}</AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>
            {user?.user_metadata?.full_name || user?.user_metadata?.username || 'User'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="flex-1">
        <Textarea
          ref={textareaRef}
          value={comment}
          onChange={handleTextChange}
          placeholder={placeholderText || placeholder}
          rows={1}
          className="resize-none border rounded-md focus:ring-0 focus:border-primary"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 border-none shadow-none w-fit">
                      <EmojiPicker 
                        onEmojiClick={handleEmojiSelect} 
                        width={320}
                        height={300}
                        lazyLoadEmojis={true}
                      />
                    </PopoverContent>
                  </Popover>
                </TooltipTrigger>
                <TooltipContent>
                  Add emoji
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled>
                    <Image className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Add image (coming soon)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" disabled>
                    <AtSign className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Tag user (coming soon)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  Posting...
                </>
              ) : (
                <>
                  Post <Send className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;

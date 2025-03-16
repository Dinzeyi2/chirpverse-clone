
import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CommentFormProps {
  onCommentAdded?: (content: string, media?: {type: string, url: string}[]) => void;
  postAuthorId?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({ onCommentAdded, postAuthorId }) => {
  const { postId } = useParams();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim()) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: comment.trim(),
          user_id: user.id,
          shoutout_id: postId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Create notification for post author if not the same user
      if (postAuthorId && postAuthorId !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            type: 'reply',
            content: 'replied to your post',
            recipient_id: postAuthorId,
            sender_id: user.id,
            metadata: {
              post_id: postId,
              post_excerpt: comment.substring(0, 50) + (comment.length > 50 ? '...' : '')
            }
          });
      }
      
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      
      // Call onCommentAdded with the comment content and no media
      if (onCommentAdded) onCommentAdded(comment.trim(), []);
      
      setComment('');
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-xExtraLightGray">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {user && (
            <img 
              src={user.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=2'} 
              alt="Your avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-xExtraLightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-xBlue/50 resize-none bg-transparent text-sm"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <Button 
              type="submit" 
              disabled={isSubmitting || !comment.trim()} 
              className="bg-xBlue hover:bg-xBlue/90 text-white font-medium px-4 py-2 rounded-full disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Reply'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;


import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, MoreHorizontal, Trash } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import CommentForm from './CommentForm';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    created_at?: string;
    userId: string;
    user: {
      id: string;
      username: string;
      name: string;
      full_name?: string;
      avatar: string;
      verified: boolean;
    };
    likes?: number;
    liked_by_user?: boolean;
    media?: {
      type: string;
      url: string;
    }[] | null;
    metadata?: any;
  };
  isReply?: boolean;
  onDeleted?: () => void;
}

const Comment: React.FC<CommentProps> = ({ comment, isReply = false, onDeleted }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);

  // Check if the comment is a reply
  const isCommentReply = comment.metadata?.reply_to != null;
  const replyingToUsername = isCommentReply 
    ? comment.metadata?.reply_to?.username 
    : null;

  const handleLikeComment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like comments",
        variant: "destructive",
      });
      return;
    }

    try {
      if (comment.liked_by_user) {
        // Unlike the comment
        await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);

        toast({
          title: "Like removed",
          description: "You've removed your like from this comment",
        });
      } else {
        // Like the comment
        await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: user.id
          });

        toast({
          title: "Comment liked",
          description: "You've liked this comment",
        });
      }

      // Invalidate the comments query to refresh the data
      queryClient.invalidateQueries({
        queryKey: ['comments'],
      });
    } catch (error) {
      console.error("Error liking/unliking comment:", error);
      toast({
        title: "Error",
        description: "There was an error processing your request",
        variant: "destructive",
      });
    }
  };

  const handleDeleteComment = async () => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Comment deleted",
        description: "Your comment has been deleted successfully",
      });

      // Call the onDeleted callback if provided
      if (onDeleted) {
        onDeleted();
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: ['comments'],
      });
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Failed to delete comment",
        description: error.message || "There was an error deleting your comment",
        variant: "destructive",
      });
    }
  };

  const fetchReplies = async () => {
    if (!comment.id) return;

    setLoadingReplies(true);

    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles!inner(*)')
        .eq('shoutout_id', comment.metadata?.post_id || '')
        .contains('metadata', { parent_id: comment.id })
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      // Format replies to match the comment structure
      const formattedReplies = data.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.created_at,
        created_at: reply.created_at,
        userId: reply.user_id,
        user: {
          id: reply.user.user_id || reply.user.id,
          username: reply.user.username || '',
          name: reply.user.full_name,
          full_name: reply.user.full_name,
          avatar: reply.user.avatar_url || '',
          verified: reply.user.verified || false
        },
        likes: 0, // You can fetch real like counts separately if needed
        liked_by_user: false,
        media: reply.media || null,
        metadata: reply.metadata || {}
      }));

      setReplies(formattedReplies);
      setShowReplies(true);
    } catch (error) {
      console.error("Error fetching replies:", error);
      toast({
        title: "Error",
        description: "Failed to load replies",
        variant: "destructive",
      });
    } finally {
      setLoadingReplies(false);
    }
  };

  const handleReply = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to reply to comments",
        variant: "destructive",
      });
      return;
    }

    setIsReplying(true);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
  };

  const handleReplySuccess = () => {
    setIsReplying(false);
    fetchReplies();
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries({
      queryKey: ['comments'],
    });
  };

  const handleToggleReplies = () => {
    if (showReplies) {
      setShowReplies(false);
    } else {
      fetchReplies();
    }
  };

  const formatDateString = (dateStr: string) => {
    return formatDate(dateStr);
  };

  return (
    <div className={`flex space-x-3 ${isReply ? 'ml-12 mt-3' : 'py-4 border-b border-gray-100 dark:border-gray-800'}`}>
      <Avatar className="h-8 w-8">
        <AvatarImage 
          src={comment.user.avatar} 
          alt={comment.user.name || 'User'} 
        />
        <AvatarFallback>{comment.user.name?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <div className="flex items-center">
          <h4 className="font-semibold text-sm">
            {comment.user.name}
            {comment.user.verified && (
              <span className="ml-1 text-blue-500">✓</span>
            )}
          </h4>
          <span className="mx-2 text-gray-400">·</span>
          <p className="text-xs text-gray-500">
            {formatDateString(comment.createdAt || comment.created_at || '')}
          </p>
          
          {user && (user.id === comment.userId || user.id === comment.user.id) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-0 h-8 w-8 ml-auto">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={handleDeleteComment}>
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {isCommentReply && (
          <div className="text-xs text-gray-500 mb-1">
            Replying to <span className="text-blue-500">@{replyingToUsername}</span>
          </div>
        )}
        
        <div className="mt-1 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
          {comment.content}
        </div>
        
        {comment.media && comment.media.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {comment.media.map((item, index) => (
              <div key={index} className="relative rounded-md overflow-hidden">
                {item.type === 'image' && (
                  <img 
                    src={item.url} 
                    alt={`Comment attachment ${index + 1}`}
                    className="h-24 w-auto object-cover rounded-md"
                  />
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex mt-2 space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-2 gap-1 ${comment.liked_by_user ? 'text-red-500' : 'text-gray-500'}`}
            onClick={handleLikeComment}
          >
            <Heart className="h-4 w-4" />
            <span>{comment.likes || 0}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 gap-1 text-gray-500"
            onClick={handleReply}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Reply</span>
          </Button>
        </div>
        
        {isReplying && (
          <div className="mt-3">
            <CommentForm 
              postId={comment.metadata?.post_id || ''}
              parentId={comment.id}
              replyToMetadata={{
                reply_to: {
                  comment_id: comment.id,
                  username: comment.user.username
                },
                parent_id: comment.id
              }}
              placeholderText={`Reply to ${comment.user.name}...`}
              isReply={true}
              onSuccess={handleReplySuccess}
              onCancel={handleCancelReply}
              onCommentAdded={handleReplySuccess}
            />
          </div>
        )}
        
        {replies.length > 0 && showReplies && (
          <div className="mt-3">
            {replies.map(reply => (
              <Comment 
                key={reply.id} 
                comment={reply} 
                isReply={true}
                onDeleted={() => fetchReplies()}
              />
            ))}
          </div>
        )}
        
        {!isReply && comment.metadata?.has_replies && !showReplies && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-blue-500"
            onClick={handleToggleReplies}
            disabled={loadingReplies}
          >
            {loadingReplies ? 'Loading replies...' : 'View replies'}
          </Button>
        )}
        
        {!isReply && showReplies && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 text-blue-500"
            onClick={() => setShowReplies(false)}
          >
            Hide replies
          </Button>
        )}
      </div>
    </div>
  );
};

export default Comment;

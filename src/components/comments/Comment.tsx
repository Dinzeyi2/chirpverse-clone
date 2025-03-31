import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageSquare, Heart, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import CommentForm from './CommentForm';
import { Button } from '@/components/ui/button';
import { MediaItem } from '@/lib/data';
import { ReplyComment } from '@/lib/data';

interface User {
  id: string;
  username: string;
  avatar: string;
  full_name: string;
  verified: boolean;
}

interface CommentProps {
  comment: ReplyComment;
  replies?: ReplyComment[];
  onReplyClick?: (commentId: string, username: string) => void;
  postId?: string;
  currentUser?: User | null;
  level?: number;
}

const Comment = ({ 
  comment, 
  replies = [], 
  onReplyClick, 
  postId,
  currentUser,
  level = 0 
}: CommentProps) => {
  const [likes, setLikes] = useState(comment.likes || 0);
  const [likedByUser, setLikedByUser] = useState(comment.liked_by_user || false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLikes(comment.likes || 0);
    setLikedByUser(comment.liked_by_user || false);
  }, [comment.likes, comment.liked_by_user]);

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "You must be logged in to like this comment.",
        description: "Please sign in to like comments.",
      });
      return;
    }

    try {
      const optimisticLikedByUser = !likedByUser;
      const optimisticLikes = optimisticLikedByUser ? likes + 1 : likes - 1;

      setLikedByUser(optimisticLikedByUser);
      setLikes(optimisticLikes);

      const { error } = await supabase
        .from('comment_likes')
        .upsert(
          { 
            comment_id: comment.id, 
            user_id: currentUser.id 
          },
          { onConflict: 'comment_id,user_id', ignoreDuplicates: false }
        );

      if (error) {
        console.error('Error liking comment:', error);
        toast({
          title: "Failed to like comment",
          description: "There was an error liking this comment. Please try again.",
          variant: "destructive",
        });

        // Revert optimistic updates
        setLikedByUser(likedByUser);
        setLikes(likes);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      toast({
        title: "Failed to like comment",
        description: "There was an error liking this comment. Please try again.",
        variant: "destructive",
      });

      // Revert optimistic updates
      setLikedByUser(likedByUser);
      setLikes(likes);
    }
  };

  const handleReply = () => {
    if (!currentUser) {
      toast({
        title: "You must be logged in to reply to this comment.",
        description: "Please sign in to reply to comments.",
      });
      return;
    }
    setShowReplyForm(!showReplyForm);
  };

  const handleCommentSubmitted = () => {
    setShowReplyForm(false);
  };

  const formatContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    if (!text) return '';

    const parts = text.split(urlRegex);
    const matches = text.match(urlRegex) || [];
    
    return parts.map((part, index) => {
      const isUrl = matches.some(match => match === part);
      
      if (isUrl) {
        return (
          <a 
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xBlue hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const getParentCommentId = (comment: ReplyComment): string | undefined => {
    if (comment.metadata && comment.metadata.parent_id) {
      return comment.metadata.parent_id;
    }
    return comment.id;
  };

  return (
    <div className="px-4 py-3">
      <div className="flex gap-3">
        <div>
          <Avatar className="h-9 w-9">
            <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
            <AvatarFallback>{comment.user.username?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center">
            <div>
              <span className="font-medium text-sm">{comment.user.full_name || comment.user.username}</span>
              {comment.user.verified && (
                <span className="ml-1 text-blue-500">✓</span>
              )}
              <span className="text-xGray text-xs ml-2">{formatDate(comment.created_at)}</span>
            </div>
            
            <div className="ml-auto">
              <button className="text-xGray hover:text-gray-700 dark:hover:text-gray-300">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </div>
          
          <div className="mt-1 text-sm">
            {formatContent(comment.content)}
          </div>
          
          {comment.media && comment.media.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {comment.media.map((item: MediaItem, index: number) => (
                <div key={index} className="relative group">
                  {item.type === 'image' && (
                    <img src={item.url} alt="Attachment" className="h-20 w-20 object-cover rounded-md" />
                  )}
                  {item.type === 'video' && (
                    <video src={item.url} className="h-20 w-20 object-cover rounded-md" />
                  )}
                  {item.type === 'code' && (
                    <div className="h-20 w-20 bg-gray-800 text-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                      Code Snippet
                    </div>
                  )}
                  {item.type === 'file' && (
                    <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                      File Attachment
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center mt-2 gap-4">
            <button 
              onClick={handleLike} 
              className={`flex items-center gap-1 text-xs ${comment.liked_by_user ? 'text-red-500' : 'text-xGray'}`}
              disabled={!currentUser}
            >
              <Heart size={14} className={comment.liked_by_user ? 'fill-red-500' : ''} />
              <span>{likes}</span>
            </button>
            
            <button 
              onClick={() => onReplyClick && onReplyClick(comment.id, comment.user.username)}
              className="flex items-center gap-1 text-xs text-xGray"
            >
              <MessageSquare size={14} />
              <span>Reply</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Display replies */}
      {replies.length > 0 && (
        <div className="pl-12 mt-3 space-y-3 border-l border-xExtraLightGray">
          {replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              onReplyClick={onReplyClick}
              postId={postId}
              currentUser={currentUser}
              level={level + 1}
            />
          ))}
        </div>
      )}
      
      {/* Show reply form if this is the active reply */}
      {showReplyForm && currentUser && (
        <div className="mt-2 pl-12">
          <CommentForm
            currentUser={currentUser}
            postAuthorId={postId || ''}
            onCommentAdded={handleCommentSubmitted}
            replyToMetadata={{
              reply_to: {
                comment_id: comment.id,
                username: comment.user.username
              },
              parent_id: getParentCommentId(comment)
            }}
            placeholderText={`Reply to @${comment.user.username}...`}
            parentId={getParentCommentId(comment)}
            isReply={true}
          />
        </div>
      )}
    </div>
  );
};

export default Comment;

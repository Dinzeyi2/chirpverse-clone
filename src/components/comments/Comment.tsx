import React, { useState } from 'react';
import { formatDate } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Heart, MoreHorizontal, Repeat } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import CommentForm from './CommentForm';
import { Button } from '@/components/ui/button';
import CodeBlock from '@/components/code/CodeBlock';
import { useAuth } from '@/contexts/AuthContext';
import ReactionsBar from '@/components/reactions/ReactionsBar';

interface CommentProps {
  comment: any;
  onReplyClick?: (commentId: string, username: string) => void;
  postId: string;
  currentUser: any | null;
  isReply?: boolean;
  showParentLink?: boolean;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  onReplyClick, 
  postId, 
  currentUser,
  isReply = false,
  showParentLink = false
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replies, setReplies] = useState<any[]>([]);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const { user } = useAuth();

  const fetchReplies = async () => {
    if (!showReplies) {
      setLoadingReplies(true);
      try {
        const { data, error } = await supabase
          .from('comments')
          .select('*')
          .eq('metadata->>parent_id', comment.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        setReplies(data || []);
      } catch (error: any) {
        console.error('Error fetching replies:', error);
        toast.error(error.message);
      } finally {
        setLoadingReplies(false);
      }
    }
    setShowReplies(!showReplies);
  };

  const handleCommentAdded = (content: string) => {
    setIsReplying(false);
    fetchReplies();
  };

  const handleDeleteComment = async () => {
    if (!currentUser || currentUser.id !== comment.userId) {
      toast.error("You can only delete your own comments.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);
        
      if (error) {
        throw error;
      }
      
      toast.success("Comment deleted successfully.");
      
      // Dispatch a custom event to notify the parent component about the deletion
      const deleteEvent = new CustomEvent('comment-deleted', {
        detail: { commentId: comment.id, postId: postId }
      });
      document.dispatchEvent(deleteEvent);
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast.error(error.message);
    }
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

  // Check if this comment is a reply to another comment
  const isReplyToComment = comment.metadata && 
    comment.metadata.reply_to && 
    comment.metadata.reply_to.username;
    
  // Get the username of the parent comment
  const parentCommentUsername = isReplyToComment ? 
    comment.metadata.reply_to.username : null;

  // Format content with links
  const formattedContent = formatContent(comment.content);
  
  // Extract code blocks from media if present
  const codeBlocks = comment.media ? comment.media
    .filter((item: any) => item && item.type === 'code')
    .map((item: any, index: number) => {
      try {
        const parsed = JSON.parse(item.url);
        return (
          <div key={`code-${index}`} className="mt-2 mb-4">
            <CodeBlock 
              code={parsed.code}
              language={parsed.language}
              filename={parsed.filename}
              showLineNumbers
            />
          </div>
        );
      } catch (e) {
        console.error("Failed to parse code block:", e);
        return null;
      }
    }).filter(Boolean) : [];
  
  // Extract image media
  const images = comment.media ? comment.media
    .filter((item: any) => item && item.type === 'image')
    .map((item: any, index: number) => (
      <img 
        key={`img-${index}`}
        src={item.url} 
        alt="Comment attachment" 
        className="mt-2 max-w-full rounded-lg max-h-80 object-contain"
        loading="lazy"
      />
    )) : [];
    
  // Extract video media
  const videos = comment.media ? comment.media
    .filter((item: any) => item && item.type === 'video')
    .map((item: any, index: number) => (
      <video 
        key={`video-${index}`}
        src={item.url} 
        controls
        className="mt-2 max-w-full rounded-lg max-h-80"
      />
    )) : [];

  const handleReplyClick = () => {
    if (!user) {
      toast.info("Please sign in to reply");
      return;
    }
    
    if (onReplyClick) {
      onReplyClick(comment.id, comment.user.username);
    } else {
      setIsReplying(!isReplying);
    }
  };

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
          <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{comment.user.name}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">@{comment.user.username}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">• {formatDate(comment.createdAt)}</span>
          </div>
          
          {isReplyToComment && (
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Replying to <a href={`#${parentCommentUsername}`} className="text-xBlue">@{parentCommentUsername}</a>
            </div>
          )}
          
          <div className="mt-1 break-words">
            {formattedContent.map((part, index) => (
              <React.Fragment key={index}>{part}</React.Fragment>
            ))}
          </div>
          
          {codeBlocks.map(block => block)}
          {images.map(image => image)}
          {videos.map(video => video)}
          
          <div className="mt-2 flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
            <button 
              className="hover:text-xBlue transition-colors flex items-center gap-1"
              onClick={handleReplyClick}
            >
              <MessageCircle className="h-4 w-4" />
              Reply
            </button>
            
            <ReactionsBar commentId={comment.id} postId={postId} />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                {currentUser && currentUser.id === comment.userId && (
                  <DropdownMenuItem onClick={handleDeleteComment}>
                    Delete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isReplying && (
            <CommentForm 
              currentUser={currentUser}
              postAuthorId={postId}
              onCommentAdded={handleCommentAdded}
              replyToMetadata={{
                reply_to: {
                  comment_id: comment.id,
                  username: comment.user.username
                },
                parent_id: comment.id
              }}
              placeholderText={`Reply to @${comment.user.username}...`}
              parentId={comment.id}
              isReply={true}
            />
          )}
          
          {replies.length > 0 && showReplies && (
            <div className="mt-4">
              {replies.map(reply => (
                <Comment
                  key={reply.id}
                  comment={reply}
                  onReplyClick={onReplyClick}
                  postId={postId}
                  currentUser={currentUser}
                  isReply={true}
                />
              ))}
            </div>
          )}
          
          {replies.length === 0 && showReplies && (
            <div className="mt-4 px-4 py-2 text-gray-500 dark:text-gray-400">
              No replies yet. Be the first to reply!
            </div>
          )}
          
          {replies.length > 0 || (comment.repliesCount && comment.repliesCount > 0) ? (
            <button 
              className="mt-2 text-sm text-gray-500 dark:text-gray-400 hover:text-xBlue transition-colors pl-2"
              onClick={fetchReplies}
              disabled={loadingReplies}
            >
              {loadingReplies ? 'Loading replies...' : showReplies ? 'Hide replies' : `View ${replies.length} replies`}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Comment;

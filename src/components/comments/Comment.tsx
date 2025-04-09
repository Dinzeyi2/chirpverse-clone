
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AlertCircle, Bookmark, Heart, MessageSquare, MoreHorizontal, Reply, Share2 } from 'lucide-react';
import { formatDate } from '@/lib/data';
import { MediaItem, ReplyComment } from '@/lib/data';
import { supabase } from '@/integrations/supabase/client';
import CommentForm from './CommentForm';
import CodeBlock from '@/components/code/CodeBlock';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      username: string;
      avatar: string;
      full_name: string;
      verified: boolean;
    };
    media?: MediaItem[] | null;
    likes: number;
    liked_by_user: boolean;
    metadata?: Record<string, any> | null;
  };
  replies?: ReplyComment[];
  onReplyClick?: (commentId: string, username: string) => void;
  postId?: string;
  currentUser?: any;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  replies = [],
  onReplyClick,
  postId,
  currentUser
}) => {
  const [isLiked, setIsLiked] = useState(comment.liked_by_user);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [showReplies, setShowReplies] = useState(true);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isCodeExpanded, setIsCodeExpanded] = useState(false);
  const [isReacting, setIsReacting] = useState(false);
  
  const handleReactionClick = (emoji: string) => {
    if (!currentUser) {
      toast.error('You need to sign in to react to comments');
      return;
    }
    
    setIsReacting(true);
    
    // Submit reaction to database
    const addReaction = async () => {
      try {
        const { data, error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: comment.id,
            user_id: currentUser.id,
            emoji: emoji
          })
          .select();
          
        if (error) {
          if (error.code === '23505') {
            // This is a duplicate reaction (user already reacted with this emoji)
            // Let's remove it instead
            const { error: deleteError } = await supabase
              .from('comment_reactions')
              .delete()
              .eq('comment_id', comment.id)
              .eq('user_id', currentUser.id)
              .eq('emoji', emoji);
              
            if (deleteError) {
              console.error('Error removing reaction:', deleteError);
              toast.error('Failed to remove reaction');
            } else {
              toast.success(`Removed ${emoji} reaction`);
            }
          } else {
            console.error('Error adding reaction:', error);
            toast.error('Failed to add reaction');
          }
        } else {
          toast.success(`Added ${emoji} reaction`);
        }
      } catch (error) {
        console.error('Exception adding reaction:', error);
        toast.error('Something went wrong');
      } finally {
        setIsReacting(false);
      }
    };
    
    addReaction();
  };
  
  const handleLikeClick = async () => {
    if (!currentUser) {
      toast.error('You need to sign in to like comments');
      return;
    }
    
    setIsLiked(prev => !prev);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      if (!isLiked) {
        const { error } = await supabase
          .from('comment_likes')
          .insert({
            comment_id: comment.id,
            user_id: currentUser.id
          });
          
        if (error) {
          console.error('Error liking comment:', error);
          // Revert optimistic update
          setIsLiked(false);
          setLikeCount(prev => prev - 1);
          toast.error('Failed to like comment');
        }
      } else {
        const { error } = await supabase
          .from('comment_likes')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', currentUser.id);
          
        if (error) {
          console.error('Error unliking comment:', error);
          // Revert optimistic update
          setIsLiked(true);
          setLikeCount(prev => prev + 1);
          toast.error('Failed to unlike comment');
        }
      }
    } catch (error) {
      console.error('Exception in like/unlike:', error);
      // Revert optimistic update
      setIsLiked(prev => !prev);
      setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
      toast.error('Something went wrong');
    }
  };
  
  const toggleReplies = () => {
    setShowReplies(prev => !prev);
  };
  
  const toggleReplyForm = () => {
    setShowReplyForm(prev => !prev);
  };
  
  const handleReply = () => {
    if (!currentUser) {
      toast.error('You need to sign in to reply to comments');
      return;
    }
    
    if (onReplyClick) {
      onReplyClick(comment.id, comment.user.username);
    } else {
      toggleReplyForm();
    }
  };
  
  const renderMedia = () => {
    if (!comment.media || comment.media.length === 0) return null;
    
    return (
      <div className="mt-2 space-y-2">
        {comment.media.map((item, index) => {
          if (item.type === 'image') {
            return (
              <img 
                key={index}
                src={item.url}
                alt="Comment attachment"
                className="max-h-96 rounded-lg"
              />
            );
          } else if (item.type === 'video') {
            return (
              <video 
                key={index}
                src={item.url}
                controls
                className="max-h-96 rounded-lg"
              />
            );
          } else if (item.type === 'code') {
            try {
              const codeData = JSON.parse(item.url);
              return (
                <div key={index} className="relative">
                  <CodeBlock 
                    code={codeData.code}
                    language={codeData.language}
                    expanded={isCodeExpanded}
                  />
                  {codeData.code.split('\n').length > 10 && (
                    <button
                      className="mt-2 text-xBlue text-sm hover:underline"
                      onClick={() => setIsCodeExpanded(!isCodeExpanded)}
                    >
                      {isCodeExpanded ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>
              );
            } catch (e) {
              console.error('Error parsing code data:', e);
              return null;
            }
          } else {
            return (
              <div key={index} className="p-4 border border-xExtraLightGray rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-gray-500" />
                <span className="text-sm text-gray-500">Unsupported attachment</span>
              </div>
            );
          }
        })}
      </div>
    );
  };
  
  const isReplyToComment = () => {
    return comment.metadata && 
           typeof comment.metadata === 'object' && 
           comment.metadata.reply_to && 
           typeof comment.metadata.reply_to === 'object' &&
           comment.metadata.reply_to.username;
  };
  
  const replyUsername = isReplyToComment() ? comment.metadata?.reply_to?.username : null;
  const isAIGenerated = comment.metadata?.is_ai_generated === true;
  
  const onCommentAdded = () => {
    setShowReplyForm(false);
  };
  
  const formatContent = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@(\w+)/g;
    
    let formattedContent = content.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-xBlue hover:underline">${url}</a>`;
    });
    
    formattedContent = formattedContent.replace(mentionRegex, (match, username) => {
      return `<span class="text-xBlue">@${username}</span>`;
    });
    
    return { __html: formattedContent };
  };
  
  return (
    <div className="py-4 border-b border-xExtraLightGray last:border-b-0" data-comment-id={comment.id}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
          <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center">
            <div className="flex gap-1 items-center">
              <span className="font-semibold">{comment.user.full_name || comment.user.username}</span>
              {comment.user.verified && (
                <Badge variant="outline" className="ml-1 h-5 text-xs">Verified</Badge>
              )}
              {isAIGenerated && (
                <Badge variant="outline" className="ml-1 h-5 bg-xBlue/10 text-xBlue border-xBlue/20 text-xs">AI</Badge>
              )}
            </div>
            <span className="text-xGray text-sm ml-2">
              @{comment.user.username}
            </span>
            <span className="text-xGray text-sm ml-2">
              ·
            </span>
            <span className="text-xGray text-sm ml-2">
              {formatDate(comment.created_at)}
            </span>
            
            <div className="ml-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-5 w-5 text-gray-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    if (navigator.clipboard) {
                      if (postId) {
                        const url = `${window.location.origin}/post/${postId}`;
                        navigator.clipboard.writeText(url);
                        toast.success('Post link copied to clipboard');
                      }
                    }
                  }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Copy link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    toast.success('Comment bookmarked');
                  }}>
                    <Bookmark className="mr-2 h-4 w-4" />
                    <span>Bookmark</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {replyUsername && (
            <div className="text-xGray text-sm mt-1">
              Replying to <span className="text-xBlue">@{replyUsername}</span>
            </div>
          )}
          
          <div 
            className="mt-1 whitespace-pre-wrap"
            dangerouslySetInnerHTML={formatContent(comment.content)}
          />
          
          {renderMedia()}
          
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLikeClick}
                className={`p-1.5 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
              >
                <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
              </button>
              {likeCount > 0 && (
                <span className="text-sm text-gray-500">{likeCount}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReply}
                className="p-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-gray-500"
              >
                <Reply className="h-4 w-4" />
              </button>
            </div>
            
            <Popover open={isReacting} onOpenChange={setIsReacting}>
              <PopoverTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-gray-500">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15.5 11C16.3284 11 17 10.3284 17 9.5C17 8.67157 16.3284 8 15.5 8C14.6716 8 14 8.67157 14 9.5C14 10.3284 14.6716 11 15.5 11Z" fill="currentColor" />
                    <path d="M8.5 11C9.32843 11 10 10.3284 10 9.5C10 8.67157 9.32843 8 8.5 8C7.67157 8 7 8.67157 7 9.5C7 10.3284 7.67157 11 8.5 11Z" fill="currentColor" />
                    <path d="M12 16C10.7687 16 10.0461 15.1798 9.4266 14.493C9.28264 14.3345 9.28191 14.1058 9.42021 13.9466C9.5583 13.785 9.7824 13.7563 9.95083 13.8814C10.4497 14.2068 11.1784 15 12 15C12.8489 15 13.5814 14.2135 14.0724 13.8905C14.2421 13.7661 14.4659 13.7948 14.6038 13.9558C14.7419 14.1172 14.7407 14.3457 14.5966 14.5042C13.9734 15.1873 13.2534 16 12 16Z" fill="currentColor" />
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-2 flex gap-1" side="top">
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-lg"
                  onClick={() => handleReactionClick('👍')}
                >
                  👍
                </button>
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-lg"
                  onClick={() => handleReactionClick('❤️')}
                >
                  ❤️
                </button>
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-lg"
                  onClick={() => handleReactionClick('😂')}
                >
                  😂
                </button>
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-lg"
                  onClick={() => handleReactionClick('😮')}
                >
                  😮
                </button>
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-lg"
                  onClick={() => handleReactionClick('👏')}
                >
                  👏
                </button>
                <button 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-lg"
                  onClick={() => handleReactionClick('🔥')}
                >
                  🔥
                </button>
              </PopoverContent>
            </Popover>
            
            {replies.length > 0 && (
              <button 
                onClick={toggleReplies}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-2"
              >
                {showReplies ? 'Hide replies' : `Show ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`}
              </button>
            )}
          </div>
        </div>
      </div>
      
      {showReplyForm && (
        <div className="pl-12 mt-3">
          <CommentForm
            currentUser={currentUser}
            postAuthorId={comment.id}
            postId={postId} // Fixed: Pass postId to CommentForm
            onCommentAdded={onCommentAdded}
            replyToMetadata={{
              reply_to: {
                comment_id: comment.id,
                username: comment.user.username
              },
              parent_id: comment.id
            }}
            placeholderText={`Reply to @${comment.user.username}...`}
            isReply={true}
          />
        </div>
      )}
      
      {showReplies && replies.length > 0 && (
        <div className="pl-12 mt-3 space-y-4 border-l border-xExtraLightGray">
          {replies.map((reply) => (
            <div key={reply.id} className="pt-2">
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={reply.user.avatar} alt={reply.user.username} />
                  <AvatarFallback>{reply.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-semibold">{reply.user.full_name || reply.user.username}</span>
                    {reply.user.verified && (
                      <Badge variant="outline" className="ml-1 h-5 text-xs">Verified</Badge>
                    )}
                    <span className="text-xGray text-sm ml-2">
                      @{reply.user.username}
                    </span>
                    <span className="text-xGray text-sm ml-2">
                      ·
                    </span>
                    <span className="text-xGray text-sm ml-2">
                      {formatDate(reply.created_at)}
                    </span>
                  </div>
                  
                  {reply.metadata?.reply_to?.username && (
                    <div className="text-xGray text-sm mt-1">
                      Replying to <span className="text-xBlue">@{reply.metadata.reply_to.username}</span>
                    </div>
                  )}
                  
                  <div 
                    className="mt-1 whitespace-pre-wrap"
                    dangerouslySetInnerHTML={formatContent(reply.content)}
                  />
                  
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded-full hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors text-gray-500">
                        <Heart className="h-3 w-3" />
                      </button>
                      {reply.likes > 0 && (
                        <span className="text-xs text-gray-500">{reply.likes}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onReplyClick && onReplyClick(comment.id, reply.user.username)}
                        className="p-1 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-gray-500"
                      >
                        <Reply className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Comment;

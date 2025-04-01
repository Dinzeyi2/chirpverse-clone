import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Save, Smile, Check, MessageCircle, Reply as ReplyIcon, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CodeBlock from '@/components/code/CodeBlock';
import EmojiPicker, { EmojiClickData, Theme as EmojiPickerTheme } from "emoji-picker-react";
import { useTheme } from '@/components/theme/theme-provider';
import CommentForm from './CommentForm';
import { MediaItem, ReplyComment } from '@/lib/data';

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
  onDelete?: () => void;
  onReplyClick?: (commentId: string, username: string) => void;
  isNestedReply?: boolean;
  postId?: string;
  currentUser?: any;
  replies?: any[]; // Preloaded replies
  canReply?: boolean; // Added this prop to fix the TypeScript error
}

interface CommentReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

const Comment: React.FC<CommentProps> = ({ 
  comment, 
  onDelete, 
  onReplyClick,
  isNestedReply = false,
  postId,
  currentUser,
  replies = []
}) => {
  const [isLiked, setIsLiked] = useState(comment.liked_by_user);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [reactions, setReactions] = useState<CommentReaction[]>([]);
  const [isReplying, setIsReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [replyReactions, setReplyReactions] = useState<Record<string, CommentReaction[]>>({});
  
  const { toast } } from useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const commentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const hasReplies = replies && replies.length > 0;
  const replyCount = replies.length;
  
  useEffect(() => {
    if (!user) return;
    
    const checkSavedStatus = async () => {
      try {
        const { data } = await supabase
          .from('saved_comments')
          .select('*')
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .single();
          
        setIsSaved(!!data);
      } catch (error) {
        // Comment is not saved or error occurred
      }
    };
    
    checkSavedStatus();
  }, [comment.id, user]);
  
  useEffect(() => {
    const fetchCommentReactions = async () => {
      try {
        const { data: reactionData, error } = await supabase
          .from('comment_reactions')
          .select('emoji, user_id')
          .eq('comment_id', comment.id);
        
        if (error) throw error;
        
        if (reactionData && reactionData.length > 0) {
          const reactionCounts: Record<string, { count: number, reacted: boolean }> = {};
          
          reactionData.forEach((reaction: any) => {
            if (!reactionCounts[reaction.emoji]) {
              reactionCounts[reaction.emoji] = {
                count: 0,
                reacted: false
              };
            }
            
            reactionCounts[reaction.emoji].count += 1;
            
            if (user && reaction.user_id === user.id) {
              reactionCounts[reaction.emoji].reacted = true;
            }
          });
          
          const formattedReactions: CommentReaction[] = Object.entries(reactionCounts).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted
          }));
          
          setReactions(formattedReactions);
        }
      } catch (error) {
        console.error('Error fetching comment reactions:', error);
      }
    };
    
    fetchCommentReactions();
    
    const reactionsChannel = supabase
      .channel(`comment-reactions-${comment.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comment_reactions',
        filter: `comment_id=eq.${comment.id}`
      }, () => {
        fetchCommentReactions();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(reactionsChannel);
    };
  }, [comment.id, user]);
  
  useEffect(() => {
    if (replies.length === 0) return;
    
    const fetchReplyReactions = async () => {
      try {
        const replyIds = replies.map(reply => reply.id);
        
        const { data: reactionData, error } = await supabase
          .from('comment_reactions')
          .select('emoji, user_id, comment_id')
          .in('comment_id', replyIds);
        
        if (error) throw error;
        
        if (reactionData && reactionData.length > 0) {
          const reactionsByReply: Record<string, Record<string, { count: number, reacted: boolean }>> = {};
          
          replyIds.forEach(replyId => {
            reactionsByReply[replyId] = {};
          });
          
          reactionData.forEach((reaction: any) => {
            const replyId = reaction.comment_id;
            const emoji = reaction.emoji;
            
            if (!reactionsByReply[replyId][emoji]) {
              reactionsByReply[replyId][emoji] = {
                count: 0,
                reacted: false
              };
            }
            
            reactionsByReply[replyId][emoji].count += 1;
            
            if (user && reaction.user_id === user.id) {
              reactionsByReply[replyId][emoji].reacted = true;
            }
          });
          
          const formattedReactions: Record<string, CommentReaction[]> = {};
          
          Object.entries(reactionsByReply).forEach(([replyId, emojiData]) => {
            formattedReactions[replyId] = Object.entries(emojiData).map(([emoji, data]) => ({
              emoji,
              count: data.count,
              reacted: data.reacted
            }));
          });
          
          setReplyReactions(formattedReactions);
        }
      } catch (error) {
        console.error('Error fetching reply reactions:', error);
      }
    };
    
    fetchReplyReactions();
    
    const channels = replies.map(reply => {
      return supabase
        .channel(`reply-reactions-${reply.id}`)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'comment_reactions',
          filter: `comment_id=eq.${reply.id}`
        }, () => {
          fetchReplyReactions();
        })
        .subscribe();
    });
    
    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [replies, user]);
  
  const handleSave = async () => {
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to save comments",
          variant: "destructive",
        });
        return;
      }
      
      if (isSaved) {
        const { error } = await supabase
          .from('saved_comments')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: "Removed from saved",
          description: "Comment removed from your saved items",
        });
      } else {
        const { error } = await supabase
          .from('saved_comments')
          .insert({
            comment_id: comment.id,
            user_id: user.id
          });
          
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: "Saved to collection",
          description: "Comment added to your saved items",
        });
      }
    } catch (error) {
      console.error('Error toggling save status:', error);
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    }
  };
  
  const handleEmojiSelect = async (emojiData: EmojiClickData) => {
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to react to comments",
          variant: "destructive",
        });
        return;
      }
      
      const emoji = emojiData.emoji;
      const existingReaction = reactions.find(r => r.emoji === emoji && r.reacted);
      
      if (existingReaction) {
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
          
        if (error) throw error;
        
        toast({
          title: "Reaction removed",
          description: `Removed ${emoji} reaction`,
        });
      } else {
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: comment.id,
            user_id: user.id,
            emoji: emoji
          });
          
        if (error) throw error;
        
        toast({
          title: "Reaction added",
          description: `You reacted with ${emoji}`,
        });
      }
      
      setEmojiPickerOpen(false);
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };
  
  const handleReactionClick = async (emoji: string) => {
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to react to comments",
          variant: "destructive",
        });
        return;
      }
      
      const existingReaction = reactions.find(r => r.emoji === emoji && r.reacted);
      
      if (existingReaction) {
        const { error } = await supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', comment.id)
          .eq('user_id', user.id)
          .eq('emoji', emoji);
          
        if (error) throw error;
        
        toast({
          title: "Reaction removed",
          description: `Removed ${emoji} reaction`,
        });
      } else {
        const { error } = await supabase
          .from('comment_reactions')
          .insert({
            comment_id: comment.id,
            user_id: user.id,
            emoji: emoji
          });
          
        if (error) throw error;
        
        toast({
          title: "Reaction added",
          description: `You reacted with ${emoji}`,
        });
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  };
  
  const handleDelete = async () => {
    if (!user || user.id !== comment.user.id) {
      toast({
        title: "Error",
        description: "You can only delete your own comments",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleReplyClick = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to reply",
        variant: "destructive",
      });
      return;
    }
    
    if (onReplyClick) {
      onReplyClick(comment.id, comment.user.username);
      return;
    }
    
    setIsReplying(!isReplying);
    setShowReplies(true);
  };
  
  const copyCommentLink = () => {
    const url = `${window.location.origin}/post/${window.location.pathname.split('/').pop()}#comment-${comment.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Comment link copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  useEffect(() => {
    if (commentRef.current) {
      commentRef.current.id = `comment-${comment.id}`;
      
      if (window.location.hash === `#comment-${comment.id}`) {
        commentRef.current.scrollIntoView({ behavior: 'smooth' });
        commentRef.current.classList.add('highlight-comment');
        setTimeout(() => {
          commentRef.current?.classList.remove('highlight-comment');
        }, 2000);
      }
    }
  }, [comment.id]);
  
  const handleCommentAdded = () => {
    setIsReplying(false);
  };
  
  const toggleReplies = () => {
    setShowReplies(!showReplies);
  };
  
  if (comment.metadata && 
      typeof comment.metadata === 'object' && 
      'parent_id' in comment.metadata && 
      !isNestedReply) {
    return null; // Skip rendering parent replies in the main list
  }
  
  return (
    <div 
      ref={commentRef}
      className={`p-4 border-b border-xExtraLightGray transition-colors hover:bg-gray-50/5 ${isNestedReply ? 'ml-8 border-l border-xExtraLightGray' : ''}`}
    >
      {comment.metadata?.reply_to && (
        <div className="mb-1 text-xs text-gray-500">
          <span>Replying to </span>
          <span className="text-xBlue">@{comment.metadata.reply_to.username}</span>
        </div>
      )}
      
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
          <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm hover:underline" onClick={() => navigate(`/profile/${comment.user.username}`)}>
                  {comment.user.full_name || comment.user.username}
                </span>
                {comment.user.verified && (
                  <svg className="h-4 w-4 text-xBlue" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
                <span className="text-gray-500 text-sm">@{comment.user.username}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="p-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={copyCommentLink}
                  >
                    {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    {isCopied ? 'Copied!' : 'Copy link'}
                  </Button>
                  
                  {user && user.id === comment.user.id && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/10 text-sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="mt-1 text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </div>
          
          {comment.media && comment.media.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.media.map((media, index) => {
                if (media.type === 'image') {
                  return (
                    <img 
                      key={index}
                      src={media.url} 
                      alt="Comment attachment" 
                      className="rounded-lg max-h-80 w-auto" 
                      onClick={() => window.open(media.url, '_blank')}
                    />
                  );
                } else if (media.type === 'video') {
                  return (
                    <video 
                      key={index}
                      src={media.url} 
                      controls 
                      className="rounded-lg max-h-80 w-auto"
                    />
                  );
                } else if (media.type === 'code') {
                  try {
                    const codeData = JSON.parse(media.url);
                    return (
                      <CodeBlock 
                        key={index}
                        code={codeData.code}
                        language={codeData.language}
                        inPost={true}
                      />
                    );
                  } catch (e) {
                    return null;
                  }
                }
                return null;
              })}
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-6">
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <Smile className="h-4 w-4" />
                  <span className="text-xs">React</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-none">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  searchDisabled
                  skinTonesDisabled
                  width={280}
                  height={350}
                  theme={(theme === 'dark' ? 'dark' : 'light') as EmojiPickerTheme}
                />
              </PopoverContent>
            </Popover>
            
            {!isNestedReply && (
              <button 
                className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
                onClick={handleReplyClick}
              >
                <ReplyIcon className="h-4 w-4" />
                <span className="text-xs">Reply{replyCount > 0 && ` (${replyCount})`}</span>
              </button>
            )}
            
            <button 
              className={`flex items-center gap-1 ${isSaved ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition-colors`}
              onClick={handleSave}
            >
              <Save className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-xs">Save</span>
            </button>
          </div>
          
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={() => handleReactionClick(reaction.emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors
                    ${reaction.reacted 
                      ? 'bg-blue-50 border-blue-200 text-blue-500 dark:bg-blue-900/10 dark:border-blue-800/20' 
                      : 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700/30 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50'
                    }`}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
          
          {isReplying && currentUser && postId && (
            <div className="mt-3 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 mb-2">
                Replying to @{comment.user.username}
              </div>
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
                isReply={true}
              />
            </div>
          )}
          
          {hasReplies && (
            <div className="mt-2">
              <button 
                onClick={toggleReplies}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-500 mt-2"
              >
                {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                <span>{showReplies ? "Hide replies" : `Show ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}</span>
              </button>
              
              {showReplies && (
                <div className="mt-2 space-y-3 ml-4 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  {loadingReplies ? (
                    <div className="flex justify-center py-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-xBlue"></div>
                    </div>
                  ) : (
                    replies.map(reply => (
                      <div key={reply.id} className="pt-2 first:pt-0 pb-2 last:pb-0">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.user.avatar} alt={reply.user.username} />
                            <AvatarFallback>{reply.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-sm hover:underline" onClick={() => navigate(`/profile/${reply.user.username}`)}>
                                  {reply.user.full_name || reply.user.username}
                                </span>
                                <span className="text-gray-500 text-xs">@{reply.user.username}</span>
                                <span className="text-gray-500 text-xs">·</span>
                                <span className="text-gray-500 text-xs">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 p-0">
                                    <MoreHorizontal className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-0" align="end">
                                  <div className="p-1">
                                    {user && user.id === reply.user.id && (
                                      <Button
                                        variant="ghost"
                                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/10 text-xs"
                                        onClick={() => handleDeleteReply(reply.id)}
                                      >
                                        <Trash2 className="mr-2 h-3 w-3" />
                                        Delete
                                      </Button>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </div>
                            
                            <div className="mt-1 text-sm whitespace-pre-wrap break-words">
                              {reply.content}
                            </div>
                            
                            <div className="mt-2 flex items-center gap-4">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors text-xs">
                                    <Smile className="h-3 w-3" />
                                    <span>React</span>
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0 border-none">
                                  <EmojiPicker
                                    onEmojiClick={(emojiData) => {
                                      handleReplyEmojiSelect(emojiData, reply.id);
                                    }}
                                    searchDisabled
                                    skinTonesDisabled
                                    width={280}
                                    height={350}
                                    theme={(theme === 'dark' ? 'dark' : 'light') as EmojiPickerTheme}
                                  />
                                </PopoverContent>
                              </Popover>
                              
                              <button 
                                className={`flex items-center gap-1 text-xs ${isSaved ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition-colors`}
                                onClick={() => handleReplySave(reply.id)}
                              >
                                <Save className={`h-3 w-3 ${isSaved ? 'fill-current' : ''}`} />
                                <span>Save</span>
                              </button>
                            </div>
                            
                            {replyReactions[reply.id]?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {replyReactions[reply.id].map((reaction, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleReplyReactionClick(reaction.emoji, reply.id)}
                                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors
                                      ${reaction.reacted 
                                        ? 'bg-blue-50 border-blue-200 text-blue-500 dark:bg-blue-900/10 dark:border-blue-800/20' 
                                        : 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800/30 dark:border-gray-700/30 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50'
                                      }`}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span>{reaction.count}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
  
  function handleDeleteReply(replyId: string) {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to delete comments",
        variant: "destructive",
      });
      return;
    }
    
    try {
      supabase
        .from('comments')
        .delete()
        .eq('id', replyId)
        .eq('user_id', user.id)
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting reply comment:', error);
            toast({
              title: "Error",
              description: "Failed to delete comment",
              variant: "destructive",
            });
            return;
          }
          
          toast({
            title: "Success",
            description: "Reply deleted successfully",
          });
          
          const updatedReplies = replies.filter(reply => reply.id !== replyId);
          
          setReplyReactions(prevReactions => {
            const newReactions = { ...prevReactions };
            delete newReactions[replyId];
            return newReactions;
          });
        });
    } catch (error) {
      console.error('Error in handleDeleteReply:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }
  
  function handleReplyEmojiSelect(emojiData: EmojiClickData, replyId: string) {
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to react to replies",
          variant: "destructive",
        });
        return;
      }
      
      const emoji = emojiData.emoji;
      
      const currentReactions = replyReactions[replyId] || [];
      const existingReaction = currentReactions.find(r => r.emoji === emoji && r.reacted);
      
      if (existingReaction) {
        supabase
          .from('comment_reactions')
          .delete()
          .eq('comment_id', replyId)
          .eq('user_id', user.id)
          .eq('emoji', emoji)
          .then(({ error: deleteError }) => {
            if (deleteError) throw deleteError;
            
            toast({
              title: "Reaction removed",
              description: `Removed ${emoji} reaction`,
            });
          });
      } else {
        supabase
          .from('comment_reactions')
          .insert({
            comment_id: replyId,
            user_id: user.id,
            emoji: emoji
          })
          .then(({ error: insertError }) => {
            if (insertError) throw insertError;
            
            toast({
              title: "Reaction added",
              description: `You reacted with ${emoji}`,
            });
          });
      }
    } catch (error) {
      console.error('Error handling reply reaction:', error);
      toast({
        title: "Error",
        description: "Failed to update reaction",
        variant: "destructive",
      });
    }
  }
  
  function handleReplyReactionClick(emoji: string, replyId: string) {
    try {
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to react to replies",
          variant: "destructive",
        });
        return;
      }
      
      const currentReactions =

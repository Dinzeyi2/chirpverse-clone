
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, CheckCircle, Bookmark, Smile, ThumbsUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post, formatDate } from '@/lib/data';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from '@/components/theme/theme-provider';
import { useAuth } from '@/contexts/AuthContext';
import CodeBlock from '@/components/code/CodeBlock';

interface PostCardProps {
  post: Post;
}

interface EmojiReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { displayName, user } = useAuth();
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replyCount, setReplyCount] = useState(post.replies);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const hasMedia = post.images && post.images.length > 0;
  const isLightMode = theme === 'light';

  const getPrivacyName = (userId: string) => {
    if (!userId || userId.length < 4) return "blue";
    const first2 = userId.substring(0, 2);
    const last2 = userId.substring(userId.length - 2);
    return `blue${first2}${last2}`;
  };
  
  const postAuthorName = getPrivacyName(post.userId);

  useEffect(() => {
    const getCurrentUserId = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    
    getCurrentUserId();
  }, []);

  const cardBg = isLightMode ? 'bg-white' : 'bg-gradient-to-b from-black/20 to-black/40';
  const cardBorder = isLightMode ? 'border-gray-200' : 'border-neutral-800/50';
  const textColor = isLightMode ? 'text-black' : 'text-white';
  const textColorMuted = isLightMode ? 'text-gray-500' : 'text-neutral-400';
  const mediaBg = isLightMode ? 'bg-gray-100' : 'bg-black';
  const iconColor = isLightMode ? 'text-black' : 'text-white';
  const actionBg = isLightMode ? 'bg-gray-100' : 'bg-black/40';
  const actionBorder = isLightMode ? 'border-gray-200' : 'border-neutral-800/50';
  const contentBg = isLightMode ? 'bg-white' : 'bg-black/90';
  const hoverBg = isLightMode ? 'bg-gray-50' : 'bg-xBlue/10';
  const reactionBg = isLightMode ? 'bg-gray-100' : 'bg-xSecondary';
  const reactionBorder = isLightMode ? 'border-gray-300' : 'border-xBorder';
  const reactionText = isLightMode ? 'text-gray-800' : 'text-gray-300';
  const reactionActiveBg = isLightMode ? 'bg-blue-50' : 'bg-xBlue/10';
  const reactionActiveBorder = isLightMode ? 'border-blue-200' : 'border-xBlue/20';

  const getPostId = (postId: string): string => {
    return String(postId);
  };

  useEffect(() => {
    const fetchPostReactions = async () => {
      try {
        const { data: reactionData, error } = await (supabase as any)
          .from('post_reactions')
          .select('emoji, user_id')
          .eq('post_id', getPostId(post.id));
        
        if (error) throw error;
        
        if (reactionData && reactionData.length > 0) {
          const reactionCounts: Record<string, { count: number, reacted: boolean }> = {};
          const user = (await supabase.auth.getUser()).data.user;
          
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
          
          const formattedReactions: EmojiReaction[] = Object.entries(reactionCounts).map(([emoji, data]) => ({
            emoji,
            count: data.count,
            reacted: data.reacted
          }));
          
          setReactions(formattedReactions);
        }
      } catch (error) {
        console.error('Error fetching post reactions:', error);
      }
    };
    
    fetchPostReactions();
    
    const reactionsChannel = supabase
      .channel(`post-reactions-${post.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_reactions',
        filter: `post_id=eq.${getPostId(post.id)}`
      }, () => {
        fetchPostReactions();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(reactionsChannel);
    };
  }, [post.id]);

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('post_bookmarks')
          .select('*')
          .eq('post_id', getPostId(post.id))
          .single();
        
        if (data) {
          setIsBookmarked(true);
        }
      } catch (error) {
        console.log('Bookmark check error or not found:', error);
      }
    };
    
    checkBookmarkStatus();
  }, [post.id]);

  useEffect(() => {
    const fetchReplyCount = async () => {
      try {
        const { count, error } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('shoutout_id', post.id);
          
        if (error) throw error;
        if (count !== null) setReplyCount(count);
      } catch (error) {
        console.error('Error fetching reply count:', error);
      }
    };
    
    fetchReplyCount();
    
    const commentsChannel = supabase
      .channel(`comments-${post.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `shoutout_id=eq.${post.id}`
      }, (payload) => {
        setReplyCount(prev => prev + 1);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'comments',
        filter: `shoutout_id=eq.${post.id}`
      }, (payload) => {
        setReplyCount(prev => Math.max(0, prev - 1));
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(commentsChannel);
    };
  }, [post.id]);

  const handlePostClick = () => {
    navigate(`/post/${post.id}`);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please sign in to like this post');
        return;
      }
      
      if (isLiked) {
        setLikeCount(prev => prev - 1);
      } else {
        setLikeCount(prev => prev + 1);
        
        if (post.userId !== user.id) {
          await supabase.from('notifications').insert({
            type: 'like',
            content: 'liked your post',
            recipient_id: post.userId,
            sender_id: user.id,
            metadata: {
              post_id: post.id,
              post_excerpt: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
            }
          });
        }
        
        toast.success('You liked a post');
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error handling like:', error);
      toast.error('Failed to update like status');
    }
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please sign in to bookmark posts');
        return;
      }
      
      if (isBookmarked) {
        const { error } = await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', getPostId(post.id));
        
        if (error) throw error;
        setIsBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        const { error } = await supabase
          .from('post_bookmarks')
          .insert({
            post_id: getPostId(post.id),
            user_id: user.id
          });
        
        if (error) throw error;
        setIsBookmarked(true);
        
        if (post.userId !== user.id) {
          await supabase.from('notifications').insert({
            type: 'bookmark',
            content: 'bookmarked your post',
            recipient_id: post.userId,
            sender_id: user.id,
            metadata: {
              post_id: post.id,
              post_excerpt: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
            }
          });
        }
        
        toast.success('Post bookmarked');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmark. Please sign in.');
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toast.success('Share options opened');
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/post/${post.id}`);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const handleEmojiPickerOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEmojiPickerOpen(!emojiPickerOpen);
  };

  const handleEmojiSelect = async (emojiData: EmojiClickData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selectedEmoji = emojiData.emoji;
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
      toast.error('Please sign in to react to posts');
      return;
    }
    
    try {
      const existingReaction = reactions.find(reaction => reaction.emoji === selectedEmoji && reaction.reacted);
      
      if (existingReaction) {
        const { error } = await (supabase as any)
          .from('post_reactions')
          .delete()
          .eq('post_id', getPostId(post.id))
          .eq('user_id', user.id)
          .eq('emoji', selectedEmoji);
          
        if (error) throw error;
        
        toast.success(`Removed ${selectedEmoji} reaction`);
      } else {
        const { error } = await (supabase as any)
          .from('post_reactions')
          .insert({
            post_id: getPostId(post.id),
            user_id: user.id,
            emoji: selectedEmoji
          });
          
        if (error) throw error;
        
        if (post.userId !== user.id) {
          await supabase.from('notifications').insert({
            type: 'reaction',
            content: `reacted with ${selectedEmoji} to your post`,
            recipient_id: post.userId,
            sender_id: user.id,
            metadata: {
              post_id: post.id,
              post_excerpt: post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')
            }
          });
        }
        
        toast.success(`Added ${selectedEmoji} reaction`);
      }
      
      setEmojiPickerOpen(false);
    } catch (error) {
      console.error('Error saving reaction:', error);
      toast.error('Failed to save reaction');
    }
  };

  const handleReactionClick = async (emoji: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
      toast.error('Please sign in to react to posts');
      return;
    }
    
    try {
      const existingReaction = reactions.find(r => r.emoji === emoji && r.reacted);
      
      if (existingReaction) {
        const { error } = await (supabase as any)
          .from('post_reactions')
          .delete()
          .eq('post_id', getPostId(post.id))
          .eq('user_id', user.id)
          .eq('emoji', emoji);
          
        if (error) throw error;
        
        toast.success(`Removed ${emoji} reaction`);
      } else {
        const { error } = await (supabase as any)
          .from('post_reactions')
          .insert({
            post_id: getPostId(post.id),
            user_id: user.id,
            emoji: emoji
          });
          
        if (error) throw error;
        
        toast.success(`Added ${emoji} reaction`);
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };

  const renderCodeBlocks = () => {
    if (!post.codeBlocks || post.codeBlocks.length === 0) return null;
    
    return (
      <div className="mt-2">
        {post.codeBlocks.map((codeBlock, index) => (
          <CodeBlock 
            key={index}
            code={codeBlock.code}
            language={codeBlock.language}
            className="mb-2"
          />
        ))}
      </div>
    );
  };

  return (
    <div 
      onClick={handlePostClick}
      className={cn(
        'cursor-pointer block animate-fade-in relative rounded-xl overflow-hidden border',
        cardBg, 'backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-xl hover:scale-[1.01]',
        cardBorder,
        !hasMedia && 'flex flex-col justify-center'
      )}
    >
      {hasMedia ? (
        <div className={`w-full aspect-[4/3] relative overflow-hidden ${mediaBg}`}>
          <img 
            src={post.images[0]} 
            alt="Post content" 
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              !isImageLoaded ? "scale-105 blur-sm" : "scale-100 blur-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        </div>
      ) : (
        <div className="p-6 flex-1 flex flex-col">
          <p className={`text-xl ${textColor} font-medium mb-3`}>{post.content}</p>
          {renderCodeBlocks()}
        </div>
      )}
      
      <div className={`flex justify-between items-center p-2 border-t border-b ${actionBorder} ${actionBg}`}>
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center group"
              onClick={handleEmojiPickerOpen}
            >
              <div className="p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
                <Smile size={16} className={iconColor} />
              </div>
            </button>
          </PopoverTrigger>
          <PopoverContent 
            className="p-0 border-none shadow-xl"
            side="top"
          >
            <EmojiPicker
              onEmojiClick={(emojiData, event) => handleEmojiSelect(emojiData, event as unknown as React.MouseEvent)}
              searchDisabled
              skinTonesDisabled
              width={280}
              height={350}
              theme={(theme === "dark" ? "dark" : "light") as Theme}
            />
          </PopoverContent>
        </Popover>
        
        <button 
          className="flex items-center group"
          onClick={handleCommentClick}
          aria-label={`${replyCount} replies`}
        >
          <div className="p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
            <MessageCircle size={16} className={iconColor} />
          </div>
          <span className={`ml-1 text-xs group-hover:text-xBlue ${iconColor}`}>
            {formatNumber(replyCount)}
          </span>
        </button>
        
        <button 
          className={cn(
            "flex items-center group",
            isBookmarked && "text-xBlue"
          )}
          onClick={handleBookmark}
        >
          <div className={cn(
            "p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors",
            isBookmarked && "text-xBlue"
          )}>
            <Bookmark size={16} className={cn(iconColor, isBookmarked ? "fill-current" : "")} />
          </div>
        </button>
      </div>
      
      {hasMedia && (
        <div className={contentBg}>
          <h2 className={`text-base font-bold ${textColor} leading-tight mb-1 line-clamp-2 p-3 pt-3`}>
            {post.content}
          </h2>
          
          <div className="px-3">
            {renderCodeBlocks()}
          </div>
          
          <div className="flex items-center mt-1 px-3 pb-3">
            <img 
              src={post.user?.avatar} 
              alt={postAuthorName} 
              className="w-6 h-6 rounded-full object-cover mr-1.5"
            />
            <div className="flex items-center">
              <span className="font-medium text-[#4285F4] mr-1 text-sm font-heading tracking-wide">
                {post.userId === currentUserId ? displayName : postAuthorName}
              </span>
              {post.user?.verified && (
                <span className="text-xBlue">
                  <CheckCircle size={12} className="fill-xBlue text-black" />
                </span>
              )}
            </div>
            <span className={`${textColorMuted} text-xs ml-auto`}>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      )}
      
      {!hasMedia && (
        <div className={contentBg}>
          <div className="flex items-center p-3">
            <img 
              src={post.user?.avatar} 
              alt={postAuthorName} 
              className="w-6 h-6 rounded-full object-cover mr-1.5"
            />
            <div className="flex items-center">
              <span className="font-medium text-[#4285F4] mr-1 text-sm font-heading tracking-wide">
                {post.userId === currentUserId ? displayName : postAuthorName}
              </span>
              {post.user?.verified && (
                <span className="text-xBlue">
                  <CheckCircle size={12} className="fill-xBlue text-black" />
                </span>
              )}
            </div>
            <span className={`${textColorMuted} text-xs ml-auto`}>{formatDate(post.createdAt)}</span>
          </div>
        </div>
      )}
      
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 pt-0">
          {reactions.map((reaction, index) => (
            <button
              key={index}
              onClick={(e) => handleReactionClick(reaction.emoji, e)}
              className={cn(
                "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors",
                reaction.reacted 
                  ? reactionActiveBg + " " + reactionActiveBorder + " text-xBlue" 
                  : reactionBg + " " + reactionBorder + " " + reactionText + " hover:bg-xSecondary/80"
              )}
            >
              <span>{reaction.emoji}</span>
              <span>{reaction.count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PostCard;

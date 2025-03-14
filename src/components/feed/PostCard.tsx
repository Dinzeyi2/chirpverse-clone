
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, CheckCircle, Bookmark, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post, formatDate } from '@/lib/data';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";

interface PostCardProps {
  post: Post;
}

interface EmojiReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

// Vibrant color palette for cards (matching the reference images)
const cardColors = [
  'bg-[#FF426F] border-[#FF1A53] text-white', // Bright Pink
  'bg-[#0EA5E9] border-[#0284C7] text-white', // Ocean Blue
  'bg-[#7209B7] border-[#5B0E91] text-white', // Deep Purple
  'bg-[#4CC9F0] border-[#0EA5E9] text-white', // Sky Blue
  'bg-[#F72585] border-[#D61F69] text-white', // Magenta
  'bg-[#3A0CA3] border-[#2D0A7A] text-white', // Royal Purple
  'bg-[#4361EE] border-[#3A56D4] text-white', // Indigo Blue
  'bg-[#FB8500] border-[#DD7100] text-white', // Bright Orange
  'bg-[#F97316] border-[#EA580C] text-white', // Vivid Orange
  'bg-[#06D6A0] border-[#059669] text-white', // Emerald Green
  'bg-[#FFBE0B] border-[#FAA307] text-black', // Golden Yellow
  'bg-[#8B5CF6] border-[#7C3AED] text-white', // Vivid Purple
  'bg-[#D946EF] border-[#C026D3] text-white', // Magenta Pink
  'bg-[#EC4899] border-[#DB2777] text-white', // Hot Pink
  'bg-[#22D3EE] border-[#06B6D4] text-white', // Cyan
  'bg-[#FCDC00] border-[#FFC800] text-black', // Bright Yellow
];

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replyCount, setReplyCount] = useState(post.replies);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  
  // Generate a consistent color for each post based on post ID
  const colorIndex = Math.abs(
    post.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  ) % cardColors.length;
  
  const cardColor = cardColors[colorIndex];

  // Check if the selected color scheme has white text
  const hasWhiteText = !cardColor.includes('text-black');

  const hasMedia = post.images && post.images.length > 0;

  const getPostId = (postId: string): string => {
    return String(postId);
  };

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

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
      toast.success('You liked a post');
    }
    setIsLiked(!isLiked);
  };

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
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
            user_id: (await supabase.auth.getUser()).data.user?.id
          });
        
        if (error) throw error;
        setIsBookmarked(true);
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

  const handleEmojiSelect = (emojiData: EmojiClickData, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const selectedEmoji = emojiData.emoji;
    
    const existingReaction = reactions.find(reaction => reaction.emoji === selectedEmoji);
    
    if (existingReaction) {
      if (existingReaction.reacted) {
        setReactions(prev => 
          prev.map(r => 
            r.emoji === selectedEmoji 
              ? { ...r, count: r.count - 1, reacted: false } 
              : r
          ).filter(r => r.count > 0)
        );
        toast.success(`Removed ${selectedEmoji} reaction`);
      } else {
        setReactions(prev => 
          prev.map(r => 
            r.emoji === selectedEmoji 
              ? { ...r, count: r.count + 1, reacted: true } 
              : r
          )
        );
        toast.success(`Added ${selectedEmoji} reaction`);
      }
    } else {
      setReactions(prev => [...prev, { emoji: selectedEmoji, count: 1, reacted: true }]);
      toast.success(`Added ${selectedEmoji} reaction`);
    }
    
    setEmojiPickerOpen(false);
  };

  const handleReactionClick = (emoji: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setReactions(prev => 
      prev.map(r => 
        r.emoji === emoji 
          ? { 
              ...r, 
              count: r.reacted ? r.count - 1 : r.count + 1, 
              reacted: !r.reacted 
            } 
          : r
      ).filter(r => r.count > 0)
    );
    
    const action = reactions.find(r => r.emoji === emoji)?.reacted 
      ? 'Removed' 
      : 'Added';
    toast.success(`${action} ${emoji} reaction`);
  };

  return (
    <div 
      onClick={handlePostClick}
      className={cn(
        'cursor-pointer block animate-fade-in relative rounded-xl overflow-hidden border-2',
        'transition-all duration-300 hover:shadow-xl hover:scale-[1.01]',
        !hasMedia && 'flex flex-col justify-center',
        cardColor // Apply the vibrant color to each card
      )}
    >
      {hasMedia ? (
        <div className="w-full aspect-[4/3] relative overflow-hidden bg-white">
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
        <div className="p-6 flex-1 flex items-center justify-center">
          <p className={cn(
            "text-xl text-center font-medium", 
            hasWhiteText ? "text-white" : "text-black"
          )}>
            {post.content}
          </p>
        </div>
      )}
      
      <div className={cn(
        "flex justify-between items-center p-2 border-t border-b",
        hasWhiteText ? "border-white/30 bg-black/20" : "border-black/30 bg-white/20"
      )}>
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center group"
              onClick={handleEmojiPickerOpen}
            >
              <div className={cn(
                "p-1 rounded-full transition-colors",
                hasWhiteText 
                  ? "group-hover:bg-white/20 text-white" 
                  : "group-hover:bg-black/20 text-black"
              )}>
                <Smile size={16} />
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
              theme={"dark" as Theme}
            />
          </PopoverContent>
        </Popover>
        
        <button 
          className="flex items-center group"
          onClick={handleCommentClick}
          aria-label={`${replyCount} replies`}
        >
          <div className={cn(
            "p-1 rounded-full transition-colors",
            hasWhiteText 
              ? "group-hover:bg-white/20" 
              : "group-hover:bg-black/20"
          )}>
            <MessageCircle size={16} className={hasWhiteText ? "text-white" : "text-black"} />
          </div>
          <span className={cn(
            "ml-1 text-xs", 
            hasWhiteText ? "text-white group-hover:text-white/80" : "text-black group-hover:text-black/80"
          )}>
            {formatNumber(replyCount)}
          </span>
        </button>
        
        <button 
          className={cn(
            "flex items-center group",
            isBookmarked && (hasWhiteText ? "text-white" : "text-black")
          )}
          onClick={handleBookmark}
        >
          <div className={cn(
            "p-1 rounded-full transition-colors",
            hasWhiteText 
              ? "group-hover:bg-white/20" 
              : "group-hover:bg-black/20",
            isBookmarked && (hasWhiteText ? "text-white" : "text-black")
          )}>
            <Bookmark 
              size={16} 
              className={cn(
                hasWhiteText ? "text-white" : "text-black", 
                isBookmarked ? "fill-current" : ""
              )} 
            />
          </div>
        </button>
      </div>
      
      {hasMedia && (
        <div className="p-3">
          <h2 className={cn(
            "text-base font-bold leading-tight mb-1 line-clamp-2", 
            hasWhiteText ? "text-white" : "text-black"
          )}>
            {post.content}
          </h2>
          
          <div className="flex items-center mt-1">
            <img 
              src={post.user?.avatar} 
              alt={post.user?.name} 
              className="w-6 h-6 rounded-full object-cover mr-1.5"
            />
            <div className="flex items-center">
              <span className={cn(
                "font-medium mr-1 text-sm", 
                hasWhiteText ? "text-white" : "text-black"
              )}>
                {post.user?.name}
              </span>
              {post.user?.verified && (
                <span className="text-white">
                  <CheckCircle size={12} className="fill-white text-blue-500" />
                </span>
              )}
            </div>
            <span className={cn(
              "text-xs ml-auto", 
              hasWhiteText ? "text-white/70" : "text-black/70"
            )}>
              {formatDate(post.createdAt)}
            </span>
          </div>
        </div>
      )}
      
      {!hasMedia && (
        <div className="p-3">
          <div className="flex items-center">
            <img 
              src={post.user?.avatar} 
              alt={post.user?.name} 
              className="w-6 h-6 rounded-full object-cover mr-1.5"
            />
            <div className="flex items-center">
              <span className={cn(
                "font-medium mr-1 text-sm", 
                hasWhiteText ? "text-white" : "text-black"
              )}>
                {post.user?.name}
              </span>
              {post.user?.verified && (
                <span className="text-white">
                  <CheckCircle size={12} className="fill-white text-blue-500" />
                </span>
              )}
            </div>
            <span className={cn(
              "text-xs ml-auto", 
              hasWhiteText ? "text-white/70" : "text-black/70"
            )}>
              {formatDate(post.createdAt)}
            </span>
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
                  ? hasWhiteText
                    ? "bg-white/20 border-white/30 text-white" 
                    : "bg-black/20 border-black/30 text-black"
                  : hasWhiteText
                    ? "bg-black/30 border-white/10 text-white/70 hover:bg-black/40" 
                    : "bg-white/30 border-black/10 text-black/70 hover:bg-white/40"
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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, CheckCircle, Bookmark, Smile, ThumbsUp, Flame } from 'lucide-react';
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

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replyCount, setReplyCount] = useState(post.replies);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isBludified, setIsBludified] = useState(false);
  const [bludifyCount, setBludifyCount] = useState(0);

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
    
    const checkBludifyStatus = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          const { data } = await supabase
            .from('post_bludifies')
            .select('*')
            .eq('post_id', getPostId(post.id))
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (data) {
            setIsBludified(true);
          }
        }
        
        const { count } = await supabase
          .from('post_bludifies')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', getPostId(post.id));
          
        if (count !== null) setBludifyCount(count);
      } catch (error) {
        console.log('Bludify check error:', error);
      }
    };
    
    checkBludifyStatus();
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

  const handleBludify = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error('Please sign in to bludify this post');
        return;
      }
      
      if (isBludified) {
        const { error } = await supabase
          .from('post_bludifies')
          .delete()
          .eq('post_id', getPostId(post.id))
          .eq('user_id', user.id);
        
        if (error) throw error;
        setIsBludified(false);
        setBludifyCount(prev => Math.max(0, prev - 1));
        toast.success('Bludify removed');
      } else {
        const { error } = await supabase
          .from('post_bludifies')
          .insert({
            post_id: getPostId(post.id),
            user_id: user.id
          });
        
        if (error) throw error;
        setIsBludified(true);
        setBludifyCount(prev => prev + 1);
        toast.success('Post bludified! This was useful');
      }
    } catch (error) {
      console.error('Error toggling bludify:', error);
      toast.error('Failed to update bludify. Please sign in.');
    }
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
        'cursor-pointer block animate-fade-in relative rounded-xl overflow-hidden border',
        'bg-gradient-to-b from-black/20 to-black/40 backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-xl hover:scale-[1.01]',
        'border-neutral-800/50',
        !hasMedia && 'flex flex-col justify-center'
      )}
    >
      {hasMedia ? (
        <div className="w-full aspect-[4/3] relative overflow-hidden bg-black">
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
          <p className="text-xl text-center text-white/90 font-medium">{post.content}</p>
        </div>
      )}
      
      <div className="flex justify-between items-center p-2 border-t border-b border-neutral-800/50 bg-black/40">
        <button 
          className={cn(
            "flex items-center group",
            isBludified && "text-xBlue"
          )}
          onClick={handleBludify}
          aria-label={`${bludifyCount} bludifies`}
        >
          <div className={cn(
            "p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors",
            isBludified && "text-xBlue"
          )}>
            <div className="flex items-center">
              <Flame size={16} className={cn(
                "text-white transition-colors",
                isBludified && "text-xBlue fill-xBlue"
              )} />
              <span className="ml-1 text-xs group-hover:text-xBlue">
                {formatNumber(bludifyCount)}
              </span>
            </div>
          </div>
        </button>
        
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center group"
              onClick={handleEmojiPickerOpen}
            >
              <div className="p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
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
          <div className="p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
            <MessageCircle size={16} className="text-white" />
          </div>
          <span className="ml-1 text-xs group-hover:text-xBlue">
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
            <Bookmark size={16} className={cn("text-white", isBookmarked ? "fill-current" : "")} />
          </div>
        </button>
      </div>
      
      {hasMedia && (
        <div className="p-3 bg-black/90">
          <h2 className="text-base font-bold text-white leading-tight mb-1 line-clamp-2">
            {post.content}
          </h2>
          
          <div className="flex items-center mt-1">
            <img 
              src={post.user?.avatar} 
              alt={post.user?.name} 
              className="w-6 h-6 rounded-full object-cover mr-1.5"
            />
            <div className="flex items-center">
              <span className="font-medium text-white/90 mr-1 text-sm">{post.user?.name}</span>
              {post.user?.verified && (
                <span className="text-xBlue">
                  <CheckCircle size={12} className="fill-xBlue text-black" />
                </span>
              )}
            </div>
            <span className="text-neutral-400 text-xs ml-auto">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      )}
      
      {!hasMedia && (
        <div className="p-3 bg-black/90">
          <div className="flex items-center">
            <img 
              src={post.user?.avatar} 
              alt={post.user?.name} 
              className="w-6 h-6 rounded-full object-cover mr-1.5"
            />
            <div className="flex items-center">
              <span className="font-medium text-white/90 mr-1 text-sm">{post.user?.name}</span>
              {post.user?.verified && (
                <span className="text-xBlue">
                  <CheckCircle size={12} className="fill-xBlue text-black" />
                </span>
              )}
            </div>
            <span className="text-neutral-400 text-xs ml-auto">{formatDate(post.createdAt)}</span>
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
                  ? "bg-xBlue/10 border-xBlue/20 text-xBlue" 
                  : "bg-xSecondary border-xBorder text-gray-300 hover:bg-xSecondary/80"
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

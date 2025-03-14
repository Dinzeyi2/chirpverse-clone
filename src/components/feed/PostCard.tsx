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

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replyCount, setReplyCount] = useState(post.replies);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

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
        'cursor-pointer block animate-fade-in relative rounded-2xl overflow-hidden border-2',
        'bg-gradient-to-b from-black/20 to-black/40 backdrop-blur-sm',
        'transition-all duration-300 hover:shadow-xl hover:scale-[1.01]',
        'border-neutral-800/50'
      )}
    >
      <div className="aspect-square w-full relative overflow-hidden bg-black">
        {post.images && post.images.length > 0 ? (
          <img 
            src={post.images[0]} 
            alt="Post content" 
            className={cn(
              "w-full h-full object-cover transition-all duration-500",
              !isImageLoaded ? "scale-105 blur-sm" : "scale-100 blur-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-950 flex items-center justify-center">
            <p className="text-neutral-400 text-lg p-8 text-center">{post.content}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center p-3 border-t border-b border-neutral-800/50 bg-black/40">
        <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
          <PopoverTrigger asChild>
            <button 
              className="flex items-center group"
              onClick={handleEmojiPickerOpen}
            >
              <div className="p-2 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
                <Smile size={18} />
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
              width={300}
              height={400}
              theme={"dark" as Theme}
            />
          </PopoverContent>
        </Popover>
        
        <button 
          className="flex items-center group"
          onClick={handleCommentClick}
          aria-label={`${replyCount} replies`}
        >
          <div className="p-2 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
            <MessageCircle size={18} className="text-white" />
          </div>
          <span className="ml-1 text-sm group-hover:text-xBlue">
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
            "p-2 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors",
            isBookmarked && "text-xBlue"
          )}>
            <Bookmark size={18} className={cn("text-white", isBookmarked ? "fill-current" : "")} />
          </div>
        </button>
      </div>
      
      <div className="p-4 bg-black/90">
        <h2 className="text-lg font-bold text-white leading-tight mb-1">
          {post.content.length > 60 ? post.content.substring(0, 60) + '...' : post.content}
        </h2>
        
        <div className="flex items-center mt-2">
          <img 
            src={post.user?.avatar} 
            alt={post.user?.name} 
            className="w-8 h-8 rounded-full object-cover mr-2"
          />
          <div className="flex items-center">
            <span className="font-medium text-white/90 mr-1">{post.user?.name}</span>
            {post.user?.verified && (
              <span className="text-xBlue">
                <CheckCircle size={14} className="fill-xBlue text-black" />
              </span>
            )}
          </div>
          <span className="text-neutral-400 text-sm ml-auto">{formatDate(post.createdAt)}</span>
        </div>
      </div>
      
      {reactions.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 pt-0">
          {reactions.map((reaction, index) => (
            <button
              key={index}
              onClick={(e) => handleReactionClick(reaction.emoji, e)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors",
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

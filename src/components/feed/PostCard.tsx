import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, MoreHorizontal, CheckCircle, Bookmark, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post, formatDate } from '@/lib/data';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface PostCardProps {
  post: Post;
}

const darkCardColor = 'bg-black border-xBorder hover:bg-xSecondary';

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
        'p-4 transition-colors cursor-pointer block animate-fade-in',
        'rounded-none shadow-none border-b',
        darkCardColor
      )}
    >
      <div className="flex">
        <div className="mr-3 flex-shrink-0">
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/profile/${post.userId}`);
            }}
            className="block cursor-pointer"
          >
            <img 
              src={post.user?.avatar} 
              alt={post.user?.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <div 
              className="font-bold hover:underline mr-1 truncate cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${post.userId}`);
              }}
            >
              {post.user?.name}
            </div>
            
            {post.user?.verified && (
              <span className="text-xBlue mr-1">
                <CheckCircle size={16} className="fill-xBlue text-black" />
              </span>
            )}
            
            <span className="text-xGray truncate">@{post.user?.username}</span>
            <span className="text-xGray mx-1">·</span>
            <span className="text-xGray">{formatDate(post.createdAt)}</span>
            
            <button 
              className="ml-auto text-xGray hover:text-xBlue hover:bg-xBlue/10 rounded-full p-1.5 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.info('More options');
              }}
            >
              <MoreHorizontal size={16} />
            </button>
          </div>
          
          <div className="mb-3">
            <p className="whitespace-pre-line">{post.content}</p>
          </div>
          
          {post.images && post.images.length > 0 && (
            <div className="mt-2 mb-3 rounded-2xl overflow-hidden">
              <img 
                src={post.images[0]} 
                alt="Post media" 
                className={cn(
                  "w-full h-auto max-h-[500px] object-cover transition-all duration-500",
                  !isImageLoaded ? "image-loading" : "image-loaded"
                )}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
          )}
          
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
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
          
          <div className="flex justify-between items-center mt-3 max-w-md text-xGray gap-4">
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
                onPointerDownOutside={(e) => {
                  if (e.target instanceof HTMLElement && 
                      (e.target.closest('.emoji-picker-react') || 
                       e.target.classList.contains('emoji-picker-react'))) {
                    e.preventDefault();
                  }
                }}
              >
                <EmojiPicker
                  onEmojiClick={(emojiData, event) => handleEmojiSelect(emojiData, event as unknown as React.MouseEvent)}
                  searchDisabled
                  skinTonesDisabled
                  width={300}
                  height={400}
                  theme="dark"
                />
              </PopoverContent>
            </Popover>
            
            <div className="flex ml-auto gap-4">
              <button 
                className="flex items-center group"
                onClick={handleCommentClick}
                aria-label={`${replyCount} replies`}
              >
                <div className="p-2 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors">
                  <MessageCircle size={18} />
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
                  <Bookmark size={18} className={isBookmarked ? "fill-current" : ""} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share, MoreHorizontal, CheckCircle, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post, formatDate } from '@/lib/data';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

interface PostCardProps {
  post: Post;
}

const cardColors = [
  'bg-[#F2FCE2] border-[#D9E6C4]', // Soft Green
  'bg-[#FEF7CD] border-[#E8E0B0]', // Soft Yellow
  'bg-[#FEC6A1] border-[#E5B491]', // Soft Orange
  'bg-[#E5DEFF] border-[#CEC6E6]', // Soft Purple
  'bg-[#FFDEE2] border-[#E6C9CC]', // Soft Pink
  'bg-[#FDE1D3] border-[#E5CCBE]', // Soft Peach
  'bg-[#D3E4FD] border-[#BED0E8]', // Soft Blue
  'bg-[#F1F0FB] border-[#DCDCE8]', // Soft Gray
];

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [replyCount, setReplyCount] = useState(post.replies);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const colorIndex = post.id.charCodeAt(0) % cardColors.length;
  const cardColor = cardColors[colorIndex];

  // Convert post.id to a safe string for use as post_id in bookmarks
  const getPostId = (postId: string): string => {
    return String(postId);
  };

  // Check if post is bookmarked on component mount
  React.useEffect(() => {
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
        // Post is not bookmarked or user is not authenticated
        console.log('Bookmark check error or not found:', error);
      }
    };
    
    checkBookmarkStatus();
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
        // Remove bookmark
        const { error } = await supabase
          .from('post_bookmarks')
          .delete()
          .eq('post_id', getPostId(post.id));
        
        if (error) throw error;
        setIsBookmarked(false);
        toast.success('Bookmark removed');
      } else {
        // Add bookmark
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
    
    // Implementation would connect to native share API
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

  return (
    <div 
      onClick={handlePostClick}
      className={cn(
        'p-4 hover:bg-black/[0.02] transition-colors cursor-pointer block animate-fade-in',
        'rounded-2xl shadow-md hover:shadow-lg border-2',
        cardColor
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
                <CheckCircle size={16} className="fill-xBlue text-white" />
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
          
          <div className="flex justify-between items-center mt-3 max-w-md text-xGray">
            <button 
              className="flex items-center group"
              onClick={handleCommentClick}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="ml-1 text-sm group-hover:text-blue-500">
                {formatNumber(replyCount)}
              </span>
            </button>
            
            <button 
              className={cn(
                "flex items-center group",
                isLiked && "text-pink-500"
              )}
              onClick={handleLike}
            >
              <div className={cn(
                "p-2 rounded-full group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors",
                isLiked && "text-pink-500"
              )}>
                <Heart size={18} className={isLiked ? "fill-current" : ""} />
              </div>
              <span className={cn(
                "ml-1 text-sm group-hover:text-pink-500",
                isLiked && "text-pink-500"
              )}>
                {formatNumber(likeCount)}
              </span>
            </button>
            
            <button 
              className={cn(
                "flex items-center group",
                isBookmarked && "text-blue-500"
              )}
              onClick={handleBookmark}
            >
              <div className={cn(
                "p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors",
                isBookmarked && "text-blue-500"
              )}>
                <Bookmark size={18} className={isBookmarked ? "fill-current" : ""} />
              </div>
            </button>
            
            <button 
              className="flex items-center group"
              onClick={handleShare}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <Share size={18} />
              </div>
              <span className="ml-1 text-sm group-hover:text-blue-500">
                {formatNumber(post.views)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;

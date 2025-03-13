
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Repeat, MessageCircle, Share, MoreHorizontal, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Post, formatDate } from '@/lib/data';
import { toast } from 'sonner';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.liked || false);
  const [isReposted, setIsReposted] = useState(post.reposted || false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [repostCount, setRepostCount] = useState(post.reposts);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

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

  const handleRepost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isReposted) {
      setRepostCount(prev => prev - 1);
    } else {
      setRepostCount(prev => prev + 1);
      toast.success('Post reposted to your profile');
    }
    setIsReposted(!isReposted);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Implementation would connect to native share API
    toast.success('Share options opened');
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
    <Link 
      to={`/post/${post.id}`}
      className="border-b border-xExtraLightGray p-4 hover:bg-black/[0.02] transition-colors cursor-pointer block animate-fade-in rounded-xl shadow-sm hover:shadow-md"
    >
      <div className="flex">
        {/* Avatar */}
        <div className="mr-3 flex-shrink-0">
          <Link 
            to={`/profile/${post.userId}`} 
            className="block" 
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={post.user?.avatar} 
              alt={post.user?.name} 
              className="w-12 h-12 rounded-full object-cover"
            />
          </Link>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Post Header */}
          <div className="flex items-center mb-1">
            <Link 
              to={`/profile/${post.userId}`}
              className="font-bold hover:underline mr-1 truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {post.user?.name}
            </Link>
            
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
          
          {/* Post Content */}
          <div className="mb-3">
            <p className="whitespace-pre-line">{post.content}</p>
          </div>
          
          {/* Post Image */}
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
          
          {/* Post Actions */}
          <div className="flex justify-between items-center mt-3 max-w-md text-xGray">
            <button 
              className="flex items-center group"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.info('Reply to post');
              }}
            >
              <div className="p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <MessageCircle size={18} />
              </div>
              <span className="ml-1 text-sm group-hover:text-blue-500">
                {formatNumber(post.replies)}
              </span>
            </button>
            
            <button 
              className={cn(
                "flex items-center group",
                isReposted && "text-green-500"
              )}
              onClick={handleRepost}
            >
              <div className={cn(
                "p-2 rounded-full group-hover:bg-green-50 group-hover:text-green-500 transition-colors",
                isReposted && "text-green-500"
              )}>
                <Repeat size={18} />
              </div>
              <span className={cn(
                "ml-1 text-sm group-hover:text-green-500",
                isReposted && "text-green-500"
              )}>
                {formatNumber(repostCount)}
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
    </Link>
  );
};

export default PostCard;

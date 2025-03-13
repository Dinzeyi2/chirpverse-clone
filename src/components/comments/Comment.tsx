
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MoreHorizontal, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Comment as CommentType, formatDate } from '@/lib/data';
import { toast } from 'sonner';

interface CommentProps {
  comment: CommentType;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState(comment.liked || false);
  const [likeCount, setLikeCount] = useState(comment.likes);

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLiked) {
      setLikeCount(prev => prev - 1);
    } else {
      setLikeCount(prev => prev + 1);
      toast.success('You liked a comment');
    }
    setIsLiked(!isLiked);
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
    <div className="p-4 border-b border-xExtraLightGray hover:bg-black/[0.02] transition-colors">
      <div className="flex">
        <div className="mr-3 flex-shrink-0">
          <div
            onClick={() => navigate(`/profile/${comment.userId}`)}
            className="block cursor-pointer"
          >
            <img 
              src={comment.user?.avatar} 
              alt={comment.user?.name} 
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center mb-1">
            <div 
              className="font-bold hover:underline mr-1 truncate cursor-pointer"
              onClick={() => navigate(`/profile/${comment.userId}`)}
            >
              {comment.user?.name}
            </div>
            
            {comment.user?.verified && (
              <span className="text-xBlue mr-1">
                <CheckCircle size={14} className="fill-xBlue text-white" />
              </span>
            )}
            
            <span className="text-xGray truncate">@{comment.user?.username}</span>
            <span className="text-xGray mx-1">·</span>
            <span className="text-xGray">{formatDate(comment.createdAt)}</span>
            
            <button 
              className="ml-auto text-xGray hover:text-xBlue hover:bg-xBlue/10 rounded-full p-1.5 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toast.info('More options');
              }}
            >
              <MoreHorizontal size={14} />
            </button>
          </div>
          
          <div className="mb-2">
            <p className="whitespace-pre-line text-sm">{comment.content}</p>
          </div>
          
          {/* Render media if available */}
          {comment.media && comment.media.length > 0 && (
            <div className="mt-2 mb-3 relative">
              <div className={`grid ${comment.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-lg overflow-hidden`}>
                {comment.media.map((media, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden">
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={`Media ${index}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ) : (
                      <video 
                        src={media.url} 
                        className="w-full h-48 object-cover rounded-lg" 
                        controls
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center mt-2 text-xGray">
            <button 
              className={cn(
                "flex items-center group",
                isLiked && "text-pink-500"
              )}
              onClick={handleLike}
            >
              <div className={cn(
                "p-1 rounded-full group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors",
                isLiked && "text-pink-500"
              )}>
                <Heart size={16} className={isLiked ? "fill-current" : ""} />
              </div>
              <span className={cn(
                "ml-1 text-xs group-hover:text-pink-500",
                isLiked && "text-pink-500"
              )}>
                {formatNumber(likeCount)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;

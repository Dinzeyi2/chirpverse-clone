
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, MoreHorizontal, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Comment as CommentType, formatDate } from '@/lib/data';
import { toast } from 'sonner';

interface CommentProps {
  comment: CommentType;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const navigate = useNavigate();
  const [savedToBookmarks, setSavedToBookmarks] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactions, setReactions] = useState<{[key: string]: number}>({
    '👍': 0,
    '🙌': 0,
    '❤️': 0,
    '🔥': 0,
    '👀': 0,
    '🎉': 0,
  });
  const [userReactions, setUserReactions] = useState<{[key: string]: boolean}>({});

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSavedToBookmarks(!savedToBookmarks);
    toast.success(savedToBookmarks ? 'Removed from bookmarks' : 'Saved to bookmarks');
  };

  const handleReaction = (emoji: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setUserReactions(prev => {
      const newReactions = { ...prev };
      newReactions[emoji] = !prev[emoji];
      return newReactions;
    });
    
    setReactions(prev => {
      const newReactions = { ...prev };
      if (userReactions[emoji]) {
        newReactions[emoji] = Math.max(0, (prev[emoji] || 0) - 1);
      } else {
        newReactions[emoji] = (prev[emoji] || 0) + 1;
      }
      return newReactions;
    });
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
          
          <div className="flex items-center mt-2 justify-between text-xGray">
            {/* Emoji reactions */}
            <div className="flex space-x-2">
              <div className="flex -space-x-1 mr-2">
                {Object.entries(reactions)
                  .filter(([_, count]) => count > 0)
                  .slice(0, 3)
                  .map(([emoji, _], index) => (
                    <span key={index} className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs">
                      {emoji}
                    </span>
                  ))}
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-xs text-xGray hover:bg-xExtraLightGray/50 rounded-full px-2 py-1"
                >
                  {Object.values(reactions).some(count => count > 0) ? 
                    formatNumber(Object.values(reactions).reduce((a, b) => a + b, 0)) : 
                    'Add reaction'}
                </button>
                
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-2 bg-white shadow-lg rounded-lg p-2 z-10">
                    <div className="flex space-x-2">
                      {Object.keys(reactions).map((emoji, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            handleReaction(emoji, e);
                            setShowEmojiPicker(false);
                          }}
                          className={cn(
                            "p-1.5 rounded-full hover:bg-gray-100 transition-colors text-lg",
                            userReactions[emoji] && "bg-gray-100"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Save button */}
            <button 
              className={cn(
                "flex items-center group",
                savedToBookmarks && "text-xBlue"
              )}
              onClick={handleSave}
            >
              <div className={cn(
                "p-1 rounded-full group-hover:bg-xBlue/10 group-hover:text-xBlue transition-colors",
                savedToBookmarks && "text-xBlue"
              )}>
                <Save size={16} className={savedToBookmarks ? "fill-current" : ""} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;

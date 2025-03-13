
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, MoreHorizontal, CheckCircle, Smile } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Comment as CommentType, formatDate } from '@/lib/data';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface CommentProps {
  comment: CommentType;
}

interface EmojiReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

const Comment: React.FC<CommentProps> = ({ comment }) => {
  const navigate = useNavigate();
  const [savedToBookmarks, setSavedToBookmarks] = useState(false);
  const [reactions, setReactions] = useState<EmojiReaction[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSavedToBookmarks(!savedToBookmarks);
    toast.success(savedToBookmarks ? 'Removed from bookmarks' : 'Saved to bookmarks');
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
          
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {reactions.map((reaction, index) => (
                <button
                  key={index}
                  onClick={(e) => handleReactionClick(reaction.emoji, e)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-sm border transition-colors",
                    reaction.reacted 
                      ? "bg-blue-50 border-blue-200 text-blue-600" 
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <span>{reaction.emoji}</span>
                  <span>{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
          
          <div className="flex items-center mt-2 justify-between text-xGray">
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button 
                  className="flex items-center group"
                  onClick={handleEmojiPickerOpen}
                >
                  <div className="p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
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
                />
              </PopoverContent>
            </Popover>
            
            <button 
              className={cn(
                "flex items-center group",
                savedToBookmarks && "text-blue-500"
              )}
              onClick={handleSave}
            >
              <div className={cn(
                "p-2 rounded-full group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors",
                savedToBookmarks && "text-blue-500"
              )}>
                <Bookmark size={18} className={savedToBookmarks ? "fill-current" : ""} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;

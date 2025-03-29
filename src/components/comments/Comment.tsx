
import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Save, Smile, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import CodeBlock from '@/components/code/CodeBlock';
import EmojiPicker, { EmojiClickData, Theme } from "emoji-picker-react";
import { useTheme } from '@/components/theme/theme-provider';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    created_at: string;
    user: {
      id: string;
      username: string;
      avatar: string;
      full_name: string;
      verified: boolean;
    };
    media?: {
      type: string;
      url: string;
    }[];
    likes: number;
    liked_by_user: boolean;
  };
  onDelete?: () => void;
}

const Comment: React.FC<CommentProps> = ({ comment, onDelete }) => {
  const [isLiked, setIsLiked] = useState(comment.liked_by_user);
  const [likeCount, setLikeCount] = useState(comment.likes);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const commentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const handleSave = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from saved" : "Saved to collection",
      description: isSaved ? "Comment removed from your saved items" : "Comment added to your saved items",
    });
  };
  
  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    toast({
      title: "Reaction added",
      description: `You reacted with ${emoji}`,
    });
    setEmojiPickerOpen(false);
  };
  
  const handleDelete = async () => {
    if (!user || user.id !== comment.user.id) {
      toast({
        title: "Error",
        description: "You can only delete your own comments",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', comment.id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      });
      
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const copyCommentLink = () => {
    // Create a URL that points to this specific comment
    const url = `${window.location.origin}/post/${window.location.pathname.split('/').pop()}#comment-${comment.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      toast({
        title: "Copied!",
        description: "Comment link copied to clipboard",
      });
      setTimeout(() => setIsCopied(false), 2000);
    });
  };
  
  // Set an ID for the comment element to enable direct linking
  useEffect(() => {
    if (commentRef.current) {
      commentRef.current.id = `comment-${comment.id}`;
      
      // Check if this comment is being directly linked to
      if (window.location.hash === `#comment-${comment.id}`) {
        commentRef.current.scrollIntoView({ behavior: 'smooth' });
        commentRef.current.classList.add('highlight-comment');
        setTimeout(() => {
          commentRef.current?.classList.remove('highlight-comment');
        }, 2000);
      }
    }
  }, [comment.id]);
  
  return (
    <div 
      ref={commentRef}
      className="p-4 border-b border-xExtraLightGray transition-colors hover:bg-gray-50/5"
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={comment.user.avatar} alt={comment.user.username} />
          <AvatarFallback>{comment.user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-1">
                <span className="font-semibold text-sm hover:underline" onClick={() => navigate(`/profile/${comment.user.username}`)}>
                  {comment.user.full_name || comment.user.username}
                </span>
                {comment.user.verified && (
                  <svg className="h-4 w-4 text-xBlue" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                )}
                <span className="text-gray-500 text-sm">@{comment.user.username}</span>
                <span className="text-gray-500 text-xs">·</span>
                <span className="text-gray-500 text-xs">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-0" align="end">
                <div className="p-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-sm"
                    onClick={copyCommentLink}
                  >
                    {isCopied ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                    {isCopied ? 'Copied!' : 'Copy link'}
                  </Button>
                  
                  {user && user.id === comment.user.id && (
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50/10 text-sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="mt-1 text-sm whitespace-pre-wrap break-words">
            {comment.content}
          </div>
          
          {/* Render media content */}
          {comment.media && comment.media.length > 0 && (
            <div className="mt-3 space-y-3">
              {comment.media.map((media, index) => {
                if (media.type === 'image') {
                  return (
                    <img 
                      key={index}
                      src={media.url} 
                      alt="Comment attachment" 
                      className="rounded-lg max-h-80 w-auto" 
                      onClick={() => window.open(media.url, '_blank')}
                    />
                  );
                } else if (media.type === 'video') {
                  return (
                    <video 
                      key={index}
                      src={media.url} 
                      controls 
                      className="rounded-lg max-h-80 w-auto"
                    />
                  );
                } else if (media.type === 'code') {
                  try {
                    const codeData = JSON.parse(media.url);
                    return (
                      <CodeBlock 
                        key={index}
                        code={codeData.code}
                        language={codeData.language}
                        inPost={true}
                      />
                    );
                  } catch (e) {
                    return null;
                  }
                }
                return null;
              })}
            </div>
          )}
          
          <div className="mt-3 flex items-center gap-6">
            <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors">
                  <Smile className="h-4 w-4" />
                  <span className="text-xs">React</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 border-none">
                <EmojiPicker
                  onEmojiClick={handleEmojiSelect}
                  searchDisabled
                  skinTonesDisabled
                  width={280}
                  height={350}
                  theme={theme === 'dark' ? 'dark' : 'light' as Theme}
                />
              </PopoverContent>
            </Popover>
            
            <button 
              className={`flex items-center gap-1 ${isSaved ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-600 transition-colors`}
              onClick={handleSave}
            >
              <Save className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
              <span className="text-xs">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;

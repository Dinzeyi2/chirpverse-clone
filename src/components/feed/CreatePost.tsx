
import React, { useState, useRef, useEffect } from 'react';
import { Image, Smile, MapPin, Calendar, BarChart, X } from 'lucide-react';
import Button from '@/components/common/Button';
import { toast } from 'sonner';
import { DialogClose } from '@/components/ui/dialog';

interface CreatePostProps {
  onPostCreated?: (content: string) => void;
  inDialog?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, inDialog = false }) => {
  const [postContent, setPostContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const maxChars = 280;
  
  useEffect(() => {
    // Auto-focus the textarea when opened in a dialog
    if (inDialog && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [inDialog]);
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setPostContent(text);
      setCharCount(text.length);
      autoResizeTextarea();
    }
  };
  
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim()) {
      toast.error('Please enter some content for your post');
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (onPostCreated) {
        onPostCreated(postContent);
      }
      
      setPostContent('');
      setCharCount(0);
      setIsLoading(false);
      
      toast.success('Your post was sent successfully!');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }, 1000);
  };
  
  const calculateRemainingChars = () => {
    return maxChars - charCount;
  };
  
  const getRemainingCharsColor = () => {
    const remaining = calculateRemainingChars();
    if (remaining <= 20) return 'text-red-500';
    if (remaining <= 40) return 'text-yellow-500';
    return 'text-xGray';
  };

  return (
    <div className={inDialog ? 'bg-background' : 'px-4 pt-4 pb-2 border-b border-xExtraLightGray'}>
      {inDialog && (
        <div className="flex items-center justify-between p-4 border-b border-xExtraLightGray">
          <DialogClose className="p-2 rounded-full hover:bg-xExtraLightGray/50">
            <X size={20} />
          </DialogClose>
          {postContent.length > 0 && (
            <div className="absolute right-4">
              <span className="text-xBlue font-semibold">Drafts</span>
            </div>
          )}
        </div>
      )}
      
      <div className="flex p-4">
        <div className="mr-3">
          <img 
            src="https://i.pravatar.cc/150?img=1" 
            alt="Your avatar" 
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <textarea
                ref={textareaRef}
                className="w-full border-none text-xl focus:ring-0 resize-none placeholder:text-xGray/70 min-h-[120px] bg-transparent outline-none"
                placeholder="What's happening?"
                value={postContent}
                onChange={handleTextChange}
                rows={3}
                disabled={isLoading}
              />
            </div>
            
            {inDialog && (
              <div className="py-3 border-t border-xExtraLightGray">
                <button
                  type="button"
                  className="text-xBlue text-sm font-medium flex items-center hover:bg-xBlue/10 rounded-full px-3 py-1"
                >
                  <span className="text-xBlue mr-1">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <g><path d="M12 1.75C6.34 1.75 1.75 6.34 1.75 12S6.34 22.25 12 22.25 22.25 17.66 22.25 12 17.66 1.75 12 1.75zm-.25 10.48L10.5 17.5l-2-1.5v-3.5L7.5 9 10.25 7.5h1.5V19l-1 1-1-1V10.48zm5-1.5L15.5 9v2.5h-2.5l-.15 .03 2.9 3.47 1-1.5v-3.5z"></path></g>
                    </svg>
                  </span>
                  Everyone can reply
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex -ml-2">
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={() => toast.info('Media uploader would open here')}
                  disabled={isLoading}
                >
                  <Image size={20} />
                </button>
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={() => toast.info('Emoji picker would open here')}
                  disabled={isLoading}
                >
                  <Smile size={20} />
                </button>
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={() => toast.info('Location selector would open here')}
                  disabled={isLoading}
                >
                  <MapPin size={20} />
                </button>
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={() => toast.info('Schedule post dialog would open here')}
                  disabled={isLoading}
                >
                  <Calendar size={20} />
                </button>
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors md:block hidden"
                  onClick={() => toast.info('Analytics options would open here')}
                  disabled={isLoading}
                >
                  <BarChart size={20} />
                </button>
              </div>
              
              <div className="flex items-center">
                {postContent && (
                  <div className="mr-3 flex items-center">
                    <div className={`text-sm ${getRemainingCharsColor()}`}>
                      {calculateRemainingChars()}
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={!postContent.trim() || isLoading}
                  isLoading={isLoading}
                  className="rounded-full px-4"
                >
                  Post
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;

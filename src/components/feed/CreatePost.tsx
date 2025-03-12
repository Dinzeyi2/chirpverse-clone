
import React, { useState, useRef } from 'react';
import { Image, Smile, MapPin, Calendar, BarChart } from 'lucide-react';
import Button from '@/components/common/Button';
import { toast } from 'sonner';

interface CreatePostProps {
  onPostCreated?: (content: string) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const [postContent, setPostContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const maxChars = 280;
  
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
    <div className="px-4 pt-4 pb-2 border-b border-xExtraLightGray">
      <div className="flex">
        <div className="mr-3">
          <img 
            src="https://i.pravatar.cc/150?img=1" 
            alt="Your avatar" 
            className="w-12 h-12 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <textarea
                ref={textareaRef}
                className="w-full border-none text-xl focus:ring-0 resize-none placeholder:text-xGray/70 min-h-[80px] bg-transparent"
                placeholder="What's happening?"
                value={postContent}
                onChange={handleTextChange}
                rows={1}
                disabled={isLoading}
              />
            </div>
            
            {/* Post Actions */}
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

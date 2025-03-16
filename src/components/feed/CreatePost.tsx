import React, { useState, useRef, useEffect } from 'react';
import { Image, Smile, MapPin, Calendar, BarChart, X, Video, Info } from 'lucide-react';
import Button from '@/components/common/Button';
import { toast } from 'sonner';
import { DialogClose } from '@/components/ui/dialog';
import { supabase } from "@/integrations/supabase/client";
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostProps {
  onPostCreated?: (content: string, media?: {type: string, url: string}[]) => void;
  inDialog?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, inDialog = false }) => {
  const [postContent, setPostContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{type: string, file: File, preview: string}[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { profile, user } = useAuth();
  
  const maxChars = 280;
  const maxImages = 2;
  const maxVideoLength = 120; // 2 minutes in seconds
  
  useEffect(() => {
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

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    if (postContent.length + emojiData.emoji.length <= maxChars) {
      const newText = postContent + emojiData.emoji;
      setPostContent(newText);
      setCharCount(newText.length);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          autoResizeTextarea();
        }
      }, 10);
    }
    
    const event = window.event;
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
  };

  const handleImageClick = () => {
    if (mediaFiles.length >= maxImages && mediaFiles.some(file => file.type === 'image')) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    if (mediaFiles.some(file => file.type === 'video')) {
      toast.error('You cannot upload both images and a video');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleVideoClick = () => {
    if (mediaFiles.length > 0) {
      toast.error('You cannot upload both images and a video');
      return;
    }

    videoInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileType = file.type.split('/')[0];
    
    if (fileType === 'image') {
      if (mediaFiles.length >= maxImages) {
        toast.error(`You can only upload up to ${maxImages} images`);
        return;
      }
      
      if (mediaFiles.some(media => media.type === 'video')) {
        toast.error('You cannot upload both images and a video');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setMediaFiles(prev => [...prev, {
            type: 'image',
            file,
            preview: event.target?.result as string
          }]);
        }
      };
      reader.readAsDataURL(file);
    } 
    else if (fileType === 'video') {
      if (mediaFiles.length > 0) {
        toast.error('You can only upload one video');
        return;
      }

      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        
        if (video.duration > maxVideoLength) {
          toast.error(`Video must be less than 2 minutes long`);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            setMediaFiles([{
              type: 'video',
              file,
              preview: event.target?.result as string
            }]);
          }
        };
        reader.readAsDataURL(file);
      };
      
      video.src = URL.createObjectURL(file);
    }
    
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  // Function to extract company mentions from post content
  const extractCompanyMentions = (content: string): string[] => {
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const matches = content.match(mentionRegex);
    if (!matches) return [];
    
    // Remove the @ symbol and return unique company names
    return [...new Set(matches.map(match => match.substring(1).trim()))];
  };
  
  // Function to send notifications to users from the same company
  const sendCompanyNotifications = async (
    postId: string, 
    companies: string[], 
    postExcerpt: string
  ) => {
    if (!user || companies.length === 0) return;
    
    try {
      // For each company mentioned in the post
      for (const company of companies) {
        // Find users who have this company in their profile
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .ilike('company', `%${company}%`)
          .neq('user_id', user.id); // Don't notify the author
        
        if (usersError) {
          console.error('Error fetching users by company:', usersError);
          continue;
        }
        
        if (!users || users.length === 0) continue;
        
        // Create notification for each user
        const notifications = users.map(recipientUser => ({
          type: 'mention',
          sender_id: user.id,
          recipient_id: recipientUser.user_id,
          content: `mentioned ${company} in a post`,
          metadata: {
            post_id: postId,
            company: company,
            post_excerpt: postExcerpt.substring(0, 100) + (postExcerpt.length > 100 ? '...' : '')
          },
          is_read: false
        }));
        
        // Insert notifications in batch
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notificationError) {
          console.error('Error creating company mention notifications:', notificationError);
        } else {
          console.log(`Sent notifications to ${notifications.length} users from ${company}`);
        }
      }
    } catch (error) {
      console.error('Error in sendCompanyNotifications:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim() && mediaFiles.length === 0) {
      toast.error('Please enter some content or add media to your post');
      return;
    }
    
    setIsLoading(true);

    try {
      const mediaUrls: {type: string, url: string}[] = [];
      
      if (mediaFiles.length > 0) {
        for (const media of mediaFiles) {
          const fileExt = media.file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `posts/${fileName}`;
          
          const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, media.file);
            
          if (error) {
            console.error('Error uploading file:', error);
            throw new Error('Failed to upload media');
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);
            
          mediaUrls.push({
            type: media.type,
            url: publicUrl
          });
        }
      }
      
      // Extract company mentions
      const companyMentions = extractCompanyMentions(postContent);
      
      // Generate a unique post ID - this would normally come from your database
      const postId = crypto.randomUUID();
      
      // Send notifications for company mentions
      if (companyMentions.length > 0) {
        await sendCompanyNotifications(postId, companyMentions, postContent);
      }
      
      setTimeout(() => {
        if (onPostCreated) {
          onPostCreated(postContent, mediaUrls);
        }
        
        setPostContent('');
        setCharCount(0);
        setMediaFiles([]);
        setIsLoading(false);
        
        // Show appropriate toast message based on notifications sent
        if (companyMentions.length > 0) {
          toast.success(`Your post was sent successfully! Notifying users from ${companyMentions.join(', ')}`);
        } else {
          toast.success('Your post was sent successfully!');
        }
        
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      toast.error('Error creating post. Please try again.');
      console.error(error);
    }
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
        </div>
      )}
      
      <div className="flex p-4">
        <div className="mr-3">
          <img 
            src={profile?.avatar_url || "https://i.pravatar.cc/150?img=1"} 
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
              
              <div className="mb-4 text-sm text-gray-500 flex items-center">
                <Info className="w-4 h-4 mr-1" />
                <span>Tag companies using @ symbol (e.g., @Amazon) to reach people from those companies and send them notifications</span>
              </div>
              
              {mediaFiles.length > 0 && (
                <div className="mt-2 mb-4 relative">
                  <div className={`grid ${mediaFiles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-2xl overflow-hidden`}>
                    {mediaFiles.map((media, index) => (
                      <div key={index} className="relative rounded-2xl overflow-hidden group">
                        {media.type === 'image' ? (
                          <img 
                            src={media.preview} 
                            alt={`Uploaded media ${index}`}
                            className="w-full h-64 object-cover"
                          />
                        ) : (
                          <video 
                            src={media.preview} 
                            className="w-full h-64 object-cover" 
                            controls
                          />
                        )}
                        <button
                          type="button"
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                          onClick={() => removeMedia(index)}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept="image/*"
                />
                <input 
                  type="file" 
                  ref={videoInputRef} 
                  className="hidden" 
                  onChange={handleFileChange} 
                  accept="video/*"
                />
                
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={handleImageClick}
                  disabled={isLoading}
                >
                  <Image size={20} />
                </button>
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={handleVideoClick}
                  disabled={isLoading}
                >
                  <Video size={20} />
                </button>
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      type="button"
                      className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                      disabled={isLoading}
                    >
                      <Smile size={20} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[352px] p-0 border-none shadow-xl" align="start" side="top" onPointerDownOutside={(e) => {
                    if (e.target && (e.target as HTMLElement).closest('.emoji-picker-react')) {
                      e.preventDefault();
                    }
                  }}>
                    <div className="emoji-picker-container w-full h-[350px]" onClick={(e) => e.stopPropagation()}>
                      <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        width="100%"
                        height={350}
                        lazyLoadEmojis={false}
                        searchDisabled={false}
                        skinTonesDisabled={false}
                        previewConfig={{
                          showPreview: true,
                          defaultCaption: "Pick an emoji..."
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
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
                  disabled={(!postContent.trim() && mediaFiles.length === 0) || isLoading}
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

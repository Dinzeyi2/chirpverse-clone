import React, { useState, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { User } from '@/lib/data';
import { toast } from 'sonner';
import { Image, Smile, Video, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import EmojiPicker from 'emoji-picker-react';
import { supabase } from "@/integrations/supabase/client";

interface CommentFormProps {
  postId: string;
  currentUser: User;
  onCommentAdded: (content: string, media?: {type: string, url: string}[]) => void;
}

const CommentForm: React.FC<CommentFormProps> = ({ postId, currentUser, onCommentAdded }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{type: string, file: File, preview: string}[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const maxImages = 2;
  const maxVideoLength = 120; // 2 minutes in seconds

  const handleEmojiClick = (emojiData: { emoji: string }) => {
    const newText = content + emojiData.emoji;
    setContent(newText);
    
    // Focus back on textarea after emoji selection
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 10);
  };

  const handleImageClick = () => {
    if (mediaFiles.filter(file => file.type === 'image').length >= maxImages) {
      toast.error(`You can only upload up to ${maxImages} images`);
      return;
    }

    if (mediaFiles.some(file => file.type === 'video') && 
        mediaFiles.filter(file => file.type === 'image').length >= 1) {
      toast.error('You can only upload up to 2 images with 1 video');
      return;
    }

    fileInputRef.current?.click();
  };

  const handleVideoClick = () => {
    if (mediaFiles.some(file => file.type === 'video')) {
      toast.error('You can only upload 1 video');
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
      if (mediaFiles.filter(m => m.type === 'image').length >= maxImages) {
        toast.error(`You can only upload up to ${maxImages} images`);
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
      if (mediaFiles.some(media => media.type === 'video')) {
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
            setMediaFiles(prev => [...prev, {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && mediaFiles.length === 0) {
      toast.error('Comment cannot be empty');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const mediaUrls: {type: string, url: string}[] = [];
      
      if (mediaFiles.length > 0) {
        for (const media of mediaFiles) {
          const fileExt = media.file.name.split('.').pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `comments/${fileName}`;
          
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
      
      // Simulate API call delay
      setTimeout(() => {
        onCommentAdded(content, mediaUrls);
        setContent('');
        setMediaFiles([]);
        setIsSubmitting(false);
        toast.success('Comment posted successfully');
      }, 500);
    } catch (error) {
      setIsSubmitting(false);
      toast.error('Error posting comment. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="p-3 border-b border-xExtraLightGray">
      <div className="flex">
        <div className="mr-3 flex-shrink-0">
          <img 
            src={currentUser.avatar} 
            alt={currentUser.name} 
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a comment..."
              className="w-full min-h-[60px] max-h-[120px] mb-2 p-2 border border-xExtraLightGray focus:border-xBlue rounded-lg resize-none"
            />
            
            {mediaFiles.length > 0 && (
              <div className="mt-2 mb-3 relative">
                <div className={`grid ${mediaFiles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-2 rounded-lg overflow-hidden`}>
                  {mediaFiles.map((media, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden group">
                      {media.type === 'image' ? (
                        <img 
                          src={media.preview} 
                          alt={`Uploaded media ${index}`}
                          className="w-full h-32 object-cover"
                        />
                      ) : (
                        <video 
                          src={media.preview} 
                          className="w-full h-32 object-cover" 
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
            
            <div className="flex items-center justify-between">
              <div className="flex">
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
                  disabled={isSubmitting}
                >
                  <Image size={18} />
                </button>
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={handleVideoClick}
                  disabled={isSubmitting}
                >
                  <Video size={18} />
                </button>
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      type="button"
                      className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                      disabled={isSubmitting}
                    >
                      <Smile size={18} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[352px] p-0 border-none shadow-xl" align="start" side="top">
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
              </div>
              
              <Button 
                type="submit" 
                disabled={(!content.trim() && mediaFiles.length === 0) || isSubmitting}
                className={`px-3 py-1.5 rounded-full bg-xBlue text-white text-sm ${isSubmitting ? 'opacity-70' : 'hover:bg-opacity-90'}`}
              >
                {isSubmitting ? 'Posting...' : 'Reply'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;

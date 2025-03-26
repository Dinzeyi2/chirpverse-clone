import React, { useState, useRef, useEffect } from 'react';
import { Image, X, Video, Code } from 'lucide-react';
import Button from '@/components/common/Button';
import { toast } from 'sonner';
import { DialogClose } from '@/components/ui/dialog';
import { supabase, extractLanguageMentions, notifyLanguageUsers } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import CodeEditorDialog from '@/components/code/CodeEditorDialog';
import CodeBlock from '@/components/code/CodeBlock';
import { useIsMobile, useScreenSize } from '@/hooks/use-mobile';

interface CreatePostProps {
  onPostCreated?: (content: string, media?: {type: string, url: string}[]) => void;
  inDialog?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, inDialog = false }) => {
  const [postContent, setPostContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{type: string, file: File, preview: string}[]>([]);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  const [codeBlocks, setCodeBlocks] = useState<{code: string, language: string}[]>([]);
  const [postSuccessful, setPostSuccessful] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { width } = useScreenSize();
  
  const maxChars = 280;
  const maxImages = 2;
  const maxVideoLength = 120; // 2 minutes in seconds
  
  const blueProfileImage = "/lovable-uploads/c82714a7-4f91-4b00-922a-4caee389e8b2.png";
  
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

  const handleCodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsCodeEditorOpen(true);
  };

  const handleSaveCode = (code: string, language: string) => {
    if (!code.trim()) return;
    
    const newCodeBlock = { code, language };
    setCodeBlocks(prev => [...prev, newCodeBlock]);
    
    const codeBlockId = codeBlocks.length;
    const codePlaceholder = `[CODE_BLOCK_${codeBlockId}]`;
    
    if (postContent.length + codePlaceholder.length <= maxChars) {
      if (textareaRef.current) {
        const cursorPos = textareaRef.current.selectionStart || postContent.length;
        
        const textBefore = postContent.substring(0, cursorPos);
        const textAfter = postContent.substring(cursorPos);
        const newText = textBefore + codePlaceholder + textAfter;
        
        setPostContent(newText);
        setCharCount(newText.length);
        
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPosition = cursorPos + codePlaceholder.length;
            textareaRef.current.selectionStart = newCursorPosition;
            textareaRef.current.selectionEnd = newCursorPosition;
            autoResizeTextarea();
          }
        }, 10);
      } else {
        const newText = postContent + codePlaceholder;
        setPostContent(newText);
        setCharCount(newText.length);
      }
    } else {
      toast.error(`Adding code would exceed the ${maxChars} character limit`);
    }
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim() && mediaFiles.length === 0 && codeBlocks.length === 0) {
      toast.error('Please enter some content, add media, or include code to your post');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    setIsLoading(true);
    setPostError(null);
    
    const optimisticPostId = crypto.randomUUID();
    const currentTime = new Date().toISOString();
    const mediaUrls: {type: string, url: string}[] = [];
    
    try {
      if (onPostCreated) {
        const optimisticPost = {
          id: optimisticPostId,
          content: postContent,
          createdAt: currentTime,
          likes: 0,
          comments: 0,
          saves: 0,
          reposts: 0,
          replies: 0,
          views: 0,
          userId: user.id,
          images: mediaFiles.length > 0 ? mediaFiles.map(file => ({
            type: file.type,
            url: file.preview
          })) : null,
          user: {
            id: user.id,
            name: user?.user_metadata?.full_name || 'User',
            username: user.id.substring(0, 8),
            avatar: blueProfileImage,
            verified: false,
            followers: 0,
            following: 0,
          }
        };
        
        onPostCreated(postContent, optimisticPost.images || []);
      }
      
      const uploadPromises = mediaFiles.map(async (media) => {
        const fileExt = media.file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `posts/${fileName}`;
        
        try {
          const { data, error } = await supabase.storage
            .from('media')
            .upload(filePath, media.file);
            
          if (error) {
            console.error('Error uploading file:', error);
            throw new Error(`Failed to upload media: ${error.message}`);
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('media')
            .getPublicUrl(filePath);
            
          return {
            type: media.type,
            url: publicUrl
          };
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload media: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
        }
      });
      
      let processedContent = postContent;
      
      for (let i = 0; i < codeBlocks.length; i++) {
        const placeholder = `[CODE_BLOCK_${i}]`;
        processedContent = processedContent.replace(placeholder, '');
      }
      
      let validMedia: {type: string, url: string}[] = [];
      
      try {
        const uploadedMedia = await Promise.all(uploadPromises);
        validMedia = uploadedMedia.filter(media => media !== null) as {type: string, url: string}[];
      } catch (uploadError) {
        console.error('Error in media uploads:', uploadError);
        setPostError('Some media files failed to upload');
        setIsLoading(false);
        toast.error('Some media files failed to upload');
        return;
      }
      
      try {
        const { data: newPost, error: postError } = await supabase
          .from('shoutouts')
          .insert({
            content: processedContent,
            user_id: user.id,
            media: validMedia.length > 0 ? validMedia : null
          })
          .select('id')
          .single();
        
        if (postError) {
          console.error('Failed to create post:', postError);
          setPostError(`Failed to create post: ${postError.message}`);
          setIsLoading(false);
          toast.error(`Failed to create post: ${postError.message}`);
          return;
        }
        
        if (newPost) {
          setPostSuccessful(true);
          toast.success('Post sent successfully!');
          
          const languageMentions = extractLanguageMentions(postContent);
          console.log('Detected language mentions:', languageMentions);
          
          if (languageMentions.length > 0) {
            try {
              for (const language of languageMentions) {
                await notifyLanguageUsers(
                  user.id,
                  language,
                  postContent,
                  newPost.id
                );
              }
            } catch (notifyError) {
              console.error('Error notifying users:', notifyError);
            }
          }
          
          setPostContent('');
          setCharCount(0);
          setMediaFiles([]);
          setCodeBlocks([]);
          
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
          
          if (inDialog && dialogCloseRef.current) {
            dialogCloseRef.current.click();
          }
        }
      } catch (postCreationError) {
        console.error('Error in post creation:', postCreationError);
        setPostError('Failed to create post. Please try again.');
        toast.error('Failed to create post. Please try again.');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setPostError('Error creating post. Please try again.');
      toast.error('Error creating post. Please try again.');
    } finally {
      setIsLoading(false);
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

  const renderHighlightedContent = () => {
    if (!postContent) return null;
    
    const parts = postContent.split(/(@\w+)/g);
    
    return (
      <div className="absolute top-0 left-0 w-full pointer-events-none text-xl p-4">
        {parts.map((part, index) => {
          if (part.match(/^@\w+/)) {
            return <span key={index} className="text-blue-500">{part}</span>;
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div className={
      inDialog 
        ? isMobile 
          ? 'bg-background fixed inset-0 z-50 flex flex-col h-full w-full overflow-auto' 
          : 'bg-background'
        : 'px-4 pt-4 pb-2 border-b border-xExtraLightGray'
    }>
      {inDialog && (
        <div className="flex items-center justify-between p-4 border-b border-xExtraLightGray sticky top-0 bg-background z-10">
          <DialogClose ref={dialogCloseRef} className="p-2 rounded-full hover:bg-xExtraLightGray/50">
            <X size={20} />
          </DialogClose>
          <div className="font-medium">Compose Post</div>
          <div className="w-10"></div>
        </div>
      )}
      
      <div className={`flex p-4 ${inDialog && isMobile ? 'flex-1 overflow-auto' : ''}`}>
        <div className="mr-3">
          <img 
            src={blueProfileImage} 
            alt="Your avatar" 
            className="w-10 h-10 rounded-full object-cover"
          />
        </div>
        
        <div className="flex-1">
          <form className={inDialog && isMobile ? 'h-full flex flex-col' : ''} onSubmit={handleSubmit}>
            <div className={`mb-4 relative ${inDialog && isMobile ? 'flex-1 overflow-auto' : ''}`}>
              <textarea
                ref={textareaRef}
                className="w-full border-none text-xl focus:ring-0 resize-none placeholder:text-xGray/70 min-h-[120px] bg-transparent outline-none"
                placeholder="What's happening? Use @language to tag a programming language"
                value={postContent}
                onChange={handleTextChange}
                rows={isMobile && inDialog ? 10 : 3}
                disabled={isLoading}
              />
              
              {codeBlocks.map((codeBlock, index) => (
                <div key={index} className="my-2 relative">
                  <CodeBlock 
                    code={codeBlock.code} 
                    language={codeBlock.language} 
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    onClick={() => {
                      setCodeBlocks(prev => prev.filter((_, i) => i !== index));
                      setPostContent(prev => prev.replace(`[CODE_BLOCK_${index}]`, ''));
                      setCharCount(prev => prev - `[CODE_BLOCK_${index}]`.length);
                    }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              
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
              
              {postError && (
                <div className="mt-2 text-red-500 text-sm">
                  {postError}
                </div>
              )}
            </div>
            
            <div className={`flex items-center justify-between ${inDialog && isMobile ? 'sticky bottom-0 bg-background pt-2 border-t border-border' : ''}`}>
              <div className="flex -ml-2 p-2 border border-gray-200 rounded-full bg-background">
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
                <button 
                  type="button"
                  className="p-2 text-xBlue rounded-full hover:bg-xBlue/10 transition-colors"
                  onClick={handleCodeClick}
                  disabled={isLoading}
                  aria-label="Add code snippet"
                >
                  <Code size={20} />
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
                  disabled={(!postContent.trim() && mediaFiles.length === 0 && codeBlocks.length === 0) || isLoading}
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
      
      <CodeEditorDialog 
        open={isCodeEditorOpen}
        onClose={() => setIsCodeEditorOpen(false)}
        onSave={handleSaveCode}
      />
    </div>
  );
};

export default CreatePost;

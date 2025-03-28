import React, { useState, useRef, useEffect } from 'react';
import { Image, X, Video, Code } from 'lucide-react';
import Button from '@/components/common/Button';
import { toast } from 'sonner';
import { DialogClose } from '@/components/ui/dialog';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import CodeEditorDialog from '@/components/code/CodeEditorDialog';
import CodeBlock from '@/components/code/CodeBlock';

interface CreatePostProps {
  onPostCreated?: (content: string, media?: {type: string, url: string}[]) => void;
  inDialog?: boolean;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated, inDialog = false }) => {
  const [postContent, setPostContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<{type: string, file: File, preview: string}[]>([]);
  const [codeDialogOpen, setCodeDialogOpen] = useState(false);
  const [codeBlocks, setCodeBlocks] = useState<{code: string, language: string}[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const dialogCloseRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  const maxChars = 280;
  const blueProfileImage = "/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png";
  
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= maxChars) {
      setPostContent(text);
      setCharCount(text.length);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleVideoClick = () => {
    videoInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    const fileType = file.type.split('/')[0];
    
    if (fileType === 'image' || fileType === 'video') {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setMediaFiles(prev => [...prev, {
            type: fileType,
            file,
            preview: event.target.result as string
          }]);
        }
      };
      reader.readAsDataURL(file);
    }
    
    e.target.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const removeCodeBlock = (index: number) => {
    setCodeBlocks(prev => prev.filter((_, i) => i !== index));
  };
  
  const resetForm = () => {
    setPostContent('');
    setCharCount(0);
    setMediaFiles([]);
    setCodeBlocks([]);
    setIsLoading(false);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    if (inDialog && dialogCloseRef.current) {
      dialogCloseRef.current.click();
    }
  };
  
  const createPost = async () => {
    try {
      const { data, error } = await supabase
        .from('shoutouts')
        .insert({
          content: postContent,
          user_id: user?.id,
          media: null
        })
        .select('id')
        .single();
        
      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    }
  };
  
  const uploadMedia = async (postId: string) => {
    if (mediaFiles.length === 0) return [];
    
    const uploadPromises = mediaFiles.map(async (media) => {
      try {
        const fileExt = media.file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `posts/${fileName}`;
        
        const { error } = await supabase.storage
          .from('media')
          .upload(filePath, media.file);
          
        if (error) throw error;
        
        const { data: { publicUrl } } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);
          
        return {
          type: media.type,
          url: publicUrl
        };
      } catch (err) {
        console.error('Upload error:', err);
        return null;
      }
    });
    
    try {
      const results = await Promise.all(uploadPromises);
      return results.filter(Boolean) as {type: string, url: string}[];
    } catch (err) {
      console.error('Error in media uploads:', err);
      return [];
    }
  };
  
  const updatePostWithMedia = async (postId: string, mediaUrls: {type: string, url: string}[]) => {
    if (mediaUrls.length === 0) return;
    
    try {
      await supabase
        .from('shoutouts')
        .update({ media: mediaUrls })
        .eq('id', postId);
    } catch (err) {
      console.error('Error updating post with media:', err);
    }
  };
  
  const handleCodeInsert = (code: string, language: string) => {
    setCodeBlocks(prev => [...prev, { code, language }]);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!postContent.trim() && mediaFiles.length === 0 && codeBlocks.length === 0) {
      toast.error('Please enter content, add media, or add code');
      return;
    }
    
    if (!user) {
      toast.error('You must be logged in to post');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const optimisticPostId = crypto.randomUUID();
      
      if (onPostCreated) {
        const optimisticMedia = [
          ...codeBlocks.map(block => ({
            type: 'code',
            url: JSON.stringify({
              code: block.code,
              language: block.language
            })
          })),
          ...mediaFiles.map(file => ({
            type: file.type,
            url: file.preview
          }))
        ];
        
        onPostCreated(postContent, optimisticMedia);
      }
      
      resetForm();
      
      const postId = await createPost();
      
      let mediaUrls: {type: string, url: string}[] = [];
      if (mediaFiles.length > 0) {
        mediaUrls = await uploadMedia(postId);
      }
      
      const allMedia = [
        ...codeBlocks.map(block => ({
          type: 'code',
          url: JSON.stringify({
            code: block.code,
            language: block.language
          })
        })),
        ...mediaUrls
      ];
      
      if (allMedia.length > 0) {
        await updatePostWithMedia(postId, allMedia);
      }
      
      toast.success('Post sent successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={inDialog 
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
              
              {codeBlocks.length > 0 && (
                <div className="mt-4 space-y-4">
                  {codeBlocks.map((block, index) => (
                    <div key={index} className="relative group">
                      <CodeBlock 
                        code={block.code}
                        language={block.language}
                        className="mt-2"
                      />
                      <button
                        type="button"
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                        onClick={() => removeCodeBlock(index)}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {mediaFiles.length > 0 && (
                <div className="mt-4">
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
                  onClick={() => setCodeDialogOpen(true)}
                  disabled={isLoading}
                >
                  <Code size={20} />
                </button>
              </div>
              
              <div className="flex items-center">
                {postContent && (
                  <div className="mr-3 flex items-center">
                    <div className={`text-sm ${maxChars - charCount <= 20 ? 'text-red-500' : maxChars - charCount <= 40 ? 'text-yellow-500' : 'text-xGray'}`}>
                      {maxChars - charCount}
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  disabled={((!postContent.trim() && mediaFiles.length === 0) && codeBlocks.length === 0) || isLoading}
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
        open={codeDialogOpen}
        onClose={() => setCodeDialogOpen(false)}
        onSave={handleCodeInsert}
      />
    </div>
  );
};

export default CreatePost;

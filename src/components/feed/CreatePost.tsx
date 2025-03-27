import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageIcon, Code2, X, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { extractLanguageMentions, notifyLanguageUsers } from '@/integrations/supabase/client';
import { useTheme } from '@/components/theme/theme-provider';
import CodeEditor from '@/components/code/CodeEditor';

interface CreatePostProps {
  onPostCreated?: (content: string, media?: {type: string, url: string}[]) => void;
  buttonText?: string;
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
  triggerClassName?: string;
  placeholder?: string;
  initialContent?: string;
  initialMedia?: {type: string, url: string}[];
  autoFocus?: boolean;
}

interface MediaItem {
  type: string;
  url: string;
  file?: File;
}

interface CodeBlock {
  code: string;
  language: string;
}

const CreatePost: React.FC<CreatePostProps> = ({
  onPostCreated,
  buttonText = "Create Post",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  triggerClassName = "",
  placeholder = "What's on your mind?",
  initialContent = "",
  initialMedia = [],
  autoFocus = false,
}) => {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>(initialMedia);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, displayName } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    if (open && autoFocus && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [open, autoFocus]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const handleMediaSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newMedia: MediaItem[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds the 10MB limit`);
        continue;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error(`File ${file.name} is not an image`);
        continue;
      }
      
      try {
        // Create a unique file name
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `lovable-uploads/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError, data } = await supabase.storage
          .from('public')
          .upload(filePath, file);
          
        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);
          
        newMedia.push({
          type: 'image',
          url: publicUrl,
          file
        });
        
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error('Error in file upload:', error);
        toast.error(`Failed to process ${file.name}`);
      }
    }
    
    setSelectedMedia([...selectedMedia, ...newMedia]);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
  };

  const handleAddCodeBlock = () => {
    setShowCodeEditor(true);
  };

  const handleCodeBlockSave = (code: string, language: string) => {
    setCodeBlocks([...codeBlocks, { code, language }]);
    setShowCodeEditor(false);
  };

  const handleRemoveCodeBlock = (index: number) => {
    setCodeBlocks(codeBlocks.filter((_, i) => i !== index));
  };

  const handlePostSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to post");
      return;
    }

    if (content.trim() === "" && (!selectedMedia || selectedMedia.length === 0)) {
      toast.error("Please enter some content or add media before posting");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Submitting post...");

      // Prepare media data if any is selected
      let mediaData = null;
      if (selectedMedia && selectedMedia.length > 0) {
        mediaData = selectedMedia.map(media => ({
          type: media.type,
          url: media.url
        }));
      }

      // Extract language mentions from content
      const languageMentions = extractLanguageMentions(content);
      console.log("Extracted language mentions:", languageMentions);

      // Insert the post into the database
      const { data: newPost, error } = await supabase
        .from('shoutouts')
        .insert({
          content: content,
          user_id: user.id,
          media: mediaData,
          languages: languageMentions.length > 0 ? languageMentions : null
        })
        .select()
        .single();

      if (error) {
        console.error("Error submitting post:", error);
        toast.error("Failed to create post. Please try again.");
        setIsSubmitting(false);
        return;
      }

      console.log("Post created successfully:", newPost);
      toast.success("Post created successfully!");

      // Create notifications for language mentions
      if (languageMentions.length > 0) {
        try {
          for (const language of languageMentions) {
            await notifyLanguageUsers(
              user.id,
              language,
              content,
              newPost.id
            );
          }
        } catch (notificationError) {
          console.error("Error creating language notifications:", notificationError);
          // Continue even if notification creation fails
        }
      }

      // Clear the form data
      setContent("");
      setSelectedMedia([]);
      setCodeBlocks([]);
      
      // Keep dialog open with a loading state for 3 seconds to ensure visibility
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Explicitly refresh posts in parent component if onPostCreated is provided
      if (onPostCreated) {
        onPostCreated(content, mediaData);
      }
      
      setIsSubmitting(false);
      onClose(); // Close the dialog only after everything is done
    } catch (err) {
      console.error("Exception in post submission:", err);
      toast.error("An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  const onClose = () => {
    setOpen(false);
  };

  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-white' : 'text-black';
  const borderColor = theme === 'dark' ? 'border-neutral-800' : 'border-gray-200';
  const mediaBg = theme === 'dark' ? 'bg-neutral-900' : 'bg-gray-100';
  const mediaText = theme === 'dark' ? 'text-neutral-300' : 'text-gray-700';
  const codeBg = theme === 'dark' ? 'bg-neutral-900' : 'bg-gray-100';
  const codeText = theme === 'dark' ? 'text-neutral-300' : 'text-gray-700';
  const codeBorder = theme === 'dark' ? 'border-neutral-800' : 'border-gray-200';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize} 
          className={`${buttonClassName} ${triggerClassName}`}
        >
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[500px] ${bgColor}`}>
        <DialogHeader>
          <DialogTitle className={textColor}>Create Post</DialogTitle>
        </DialogHeader>
        <div className="flex items-start space-x-4 pt-4">
          <Avatar>
            <AvatarImage src="/lovable-uploads/325d2d74-ad68-4607-8fab-66f36f0e087e.png" alt={displayName} />
            <AvatarFallback>{displayName?.substring(0, 2) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={content}
              onChange={handleContentChange}
              className={`min-h-[100px] ${textColor} ${bgColor} border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none`}
            />
            
            {selectedMedia.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mt-4">
                {selectedMedia.map((media, index) => (
                  <div key={index} className={`relative rounded-md overflow-hidden ${mediaBg}`}>
                    <img 
                      src={media.url} 
                      alt={`Selected media ${index + 1}`} 
                      className="w-full h-32 object-cover"
                    />
                    <button 
                      onClick={() => handleRemoveMedia(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {codeBlocks.length > 0 && (
              <div className="space-y-2 mt-4">
                {codeBlocks.map((block, index) => (
                  <div key={index} className={`relative p-3 rounded-md ${codeBg} ${codeText} border ${codeBorder}`}>
                    <pre className="text-sm overflow-x-auto">
                      <code>{block.code}</code>
                    </pre>
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded">
                        {block.language}
                      </span>
                      <button 
                        onClick={() => handleRemoveCodeBlock(index)}
                        className="bg-black/70 text-white p-1 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {showCodeEditor && (
              <div className="mt-4">
                <CodeEditor onSave={handleCodeBlockSave} onCancel={() => setShowCodeEditor(false)} />
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleMediaSelect}
                  className="text-blue-500"
                >
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Media
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleAddCodeBlock}
                  className="text-blue-500"
                >
                  <Code2 className="w-4 h-4 mr-1" />
                  Code
                </Button>
              </div>
              <Button 
                onClick={handlePostSubmit}
                variant="default" 
                size="sm"
                className="rounded-full px-4"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePost;

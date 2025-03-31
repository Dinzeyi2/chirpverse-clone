
import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Smile, PaperclipIcon, Code } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CodeEditorDialog from '@/components/code/CodeEditorDialog';
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  followers: number;
  following: number;
  verified: boolean;
}

interface CommentFormProps {
  currentUser: User | null;
  postAuthorId: string;
  onCommentAdded: (content: string, media?: {type: string, url: string}[]) => void;
  replyToMetadata?: {
    reply_to: {
      comment_id: string;
      username: string;
    };
    parent_id?: string;
  };
  placeholderText?: string;
  parentId?: string;
  isReply?: boolean;
}

const CommentForm: React.FC<CommentFormProps> = ({ 
  currentUser, 
  postAuthorId, 
  onCommentAdded, 
  replyToMetadata,
  placeholderText = 'Add a comment...',
  parentId,
  isReply = false
}) => {
  // If there's no current user, don't render the comment form
  if (!currentUser) {
    return null;
  }

  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [media, setMedia] = useState<{type: string, url: string}[]>([]);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [isCodeDialogOpen, setIsCodeDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setComment(prev => prev + emojiData.emoji);
    setEmojiPickerOpen(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    try {
      const file = files[0];
      
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload files smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setIsSubmitting(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `comments/${currentUser.id}/${fileName}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from('media')
        .upload(filePath, file);
        
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);
        
      let mediaType = 'file';
      if (file.type.startsWith('image/')) {
        mediaType = 'image';
      } else if (file.type.startsWith('video/')) {
        mediaType = 'video';
      }
      
      setMedia(prev => [...prev, { type: mediaType, url: publicUrl }]);
      
      toast({
        title: "File uploaded",
        description: "Your file has been attached to the comment",
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() && media.length === 0) {
      toast({
        title: "Empty comment",
        description: "Please add some text or media to your comment",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data: postExists, error: postCheckError } = await supabase
        .from('shoutouts')
        .select('id')
        .eq('id', postAuthorId)
        .single();
      
      if (postCheckError || !postExists) {
        console.error('Error: Post does not exist:', postCheckError);
        toast({
          title: "Failed to post comment",
          description: "The post you're trying to comment on doesn't exist or has been deleted",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      const metadata: Record<string, any> = {
        display_username: currentUser.username
      };
      
      if (replyToMetadata) {
        metadata.reply_to = replyToMetadata.reply_to;
        
        if (replyToMetadata.parent_id) {
          metadata.parent_id = replyToMetadata.parent_id;
        }
      }
      
      if (parentId) {
        metadata.parent_id = parentId;
      }
      
      const { error, data } = await supabase
        .from('comments')
        .insert({
          content: comment,
          user_id: currentUser.id,
          shoutout_id: postAuthorId,
          media: media.length > 0 ? media : null,
          metadata
        });
        
      if (error) throw error;
      
      setComment('');
      setMedia([]);
      
      onCommentAdded(comment, media);
      
      toast({
        title: "Comment added",
        description: isReply ? "Your reply has been posted successfully" : "Your comment has been posted successfully"
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Failed to post comment",
        description: "There was an error posting your comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = (code: string, language: string) => {
    const codeMedia = {
      type: 'code',
      url: JSON.stringify({ code, language })
    };
    
    setMedia(prev => [...prev, codeMedia]);
    setIsCodeDialogOpen(false);
    
    toast({
      title: "Code snippet added",
      description: `Added ${language} code snippet to your comment`
    });
  };

  const removeMedia = (index: number) => {
    setMedia(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={`p-4 ${isReply ? "pl-12 border-l border-xExtraLightGray" : "border-b border-xExtraLightGray"}`}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentUser.avatar} alt={currentUser.username} />
          <AvatarFallback>{currentUser.username.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              className="w-full p-2 bg-transparent border border-xExtraLightGray rounded-lg focus:outline-none focus:ring-1 focus:ring-xBlue resize-none min-h-[80px]"
              placeholder={placeholderText}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
            
            {media.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {media.map((item, index) => (
                  <div key={index} className="relative group">
                    {item.type === 'image' && (
                      <img src={item.url} alt="Attachment" className="h-20 w-20 object-cover rounded-md" />
                    )}
                    {item.type === 'video' && (
                      <video src={item.url} className="h-20 w-20 object-cover rounded-md" />
                    )}
                    {item.type === 'code' && (
                      <div className="h-20 w-20 bg-gray-800 text-gray-200 rounded-md flex items-center justify-center overflow-hidden">
                        <Code size={24} />
                      </div>
                    )}
                    {item.type === 'file' && (
                      <div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-md flex items-center justify-center">
                        <PaperclipIcon size={24} />
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMedia(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-2 flex justify-between">
              <div className="flex gap-2">
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Smile className="h-5 w-5 text-gray-500" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 border-none">
                    <EmojiPicker onEmojiClick={handleEmojiClick} width={300} height={400} />
                  </PopoverContent>
                </Popover>
                
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => fileInputRef.current?.click()}>
                  <PaperclipIcon className="h-5 w-5 text-gray-500" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    disabled={isSubmitting}
                  />
                </Button>
                
                <Dialog open={isCodeDialogOpen} onOpenChange={setIsCodeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                      <Code className="h-5 w-5 text-gray-500" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[70vw] max-h-[85vh] overflow-y-auto">
                    <CodeEditorDialog 
                      open={isCodeDialogOpen} 
                      onClose={() => setIsCodeDialogOpen(false)} 
                      onSave={handleCodeSubmit} 
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <Button
                type="submit"
                disabled={(!comment.trim() && media.length === 0) || isSubmitting}
                className="bg-xBlue hover:bg-blue-600 text-white px-4 rounded-full"
              >
                {isSubmitting ? 'Posting...' : isReply ? 'Reply' : 'Post'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CommentForm;

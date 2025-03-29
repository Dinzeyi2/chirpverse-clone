import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Image, Video, Code } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import CodeEditorDialog from '@/components/code/CodeEditorDialog';

interface CommentFormProps {
  onCommentAdded?: (content: string, media?: {type: string, url: string}[]) => void;
  postAuthorId?: string;
  // We don't need postId since we're using useParams to get it
  currentUser?: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    followers: number;
    following: number;
    verified: boolean;
  };
}

const CommentForm: React.FC<CommentFormProps> = ({ onCommentAdded, postAuthorId, currentUser }) => {
  const { postId } = useParams();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{type: string, url: string}[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!comment.trim() && selectedMedia.length === 0) {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to comment",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let mediaUrls: {type: string, url: string}[] = [];
      
      // Upload any media files first
      if (selectedMedia.length > 0) {
        mediaUrls = selectedMedia;
      }
      
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert({
          content: comment.trim(),
          user_id: user.id,
          shoutout_id: postId,
          media: mediaUrls.length > 0 ? mediaUrls : null
        })
        .select()
        .single();
        
      if (error) throw error;
      
      // Create notification for post author if not the same user
      if (postAuthorId && postAuthorId !== user.id) {
        await supabase
          .from('notifications')
          .insert({
            type: 'reply',
            content: 'replied to your post',
            recipient_id: postAuthorId,
            sender_id: user.id,
            metadata: {
              post_id: postId,
              post_excerpt: comment.substring(0, 50) + (comment.length > 50 ? '...' : '')
            }
          });
      }
      
      toast({
        title: "Success",
        description: "Comment added successfully",
      });
      
      // Call onCommentAdded with the comment content and media
      if (onCommentAdded) onCommentAdded(comment.trim(), mediaUrls);
      
      setComment('');
      setSelectedMedia([]);
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit comment",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Only image files are allowed",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "Error",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const filename = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('comments')
        .upload(filename, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('comments')
        .getPublicUrl(filename);
        
      setSelectedMedia([...selectedMedia, {type: 'image', url: publicUrl}]);
      
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
    }
  };
  
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type and size
    if (!file.type.startsWith('video/')) {
      toast({
        title: "Error",
        description: "Only video files are allowed",
        variant: "destructive",
      });
      return;
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      toast({
        title: "Error",
        description: "Video size should be less than 20MB",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const filename = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('comments')
        .upload(filename, file);
        
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('comments')
        .getPublicUrl(filename);
        
      setSelectedMedia([...selectedMedia, {type: 'video', url: publicUrl}]);
      
      toast({
        title: "Success",
        description: "Video uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    }
  };
  
  const handleCodeSave = (code: string, language: string) => {
    const formattedCode = `\`\`\`${language}\n${code}\n\`\`\``;
    setComment(prev => prev + formattedCode);
  };
  
  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="p-4 border-t border-xExtraLightGray">
        <div className="flex flex-col items-center justify-center gap-3 py-4">
          <p className="text-center text-gray-600 dark:text-gray-400">
            You need to be logged in to comment on this post
          </p>
          <Button 
            onClick={() => navigate('/auth')}
            className="bg-xBlue hover:bg-blue-600"
          >
            Sign in to comment
          </Button>
        </div>
      </div>
    );
  }
  
  // Use either the passed currentUser or the user from auth context
  const displayUser = currentUser || (user && {
    id: user.id,
    name: user.user_metadata?.full_name || 'User',
    username: user.user_metadata?.username || user.id.substring(0, 8),
    avatar: user.user_metadata?.avatar_url || 'https://i.pravatar.cc/150?img=2',
    followers: 0,
    following: 0,
    verified: false,
  });
  
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-xExtraLightGray">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {displayUser && (
            <img 
              src={displayUser.avatar} 
              alt="Your avatar" 
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-3 border border-xExtraLightGray rounded-lg focus:outline-none focus:ring-2 focus:ring-xBlue/50 resize-none bg-transparent text-sm"
            rows={3}
          />
          
          {/* Preview media if any */}
          {selectedMedia.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {selectedMedia.map((media, index) => (
                <div key={index} className="relative">
                  {media.type === 'image' ? (
                    <img src={media.url} alt="Uploaded" className="w-20 h-20 object-cover rounded-md" />
                  ) : (
                    <video src={media.url} className="w-20 h-20 object-cover rounded-md" controls />
                  )}
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    onClick={() => {
                      setSelectedMedia(selectedMedia.filter((_, i) => i !== index));
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              {/* Image upload */}
              <label className="cursor-pointer text-xBlue hover:text-xBlue/80">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Image size={20} />
              </label>
              
              {/* Video upload */}
              <label className="cursor-pointer text-xBlue hover:text-xBlue/80">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <Video size={20} />
              </label>
              
              {/* Code Editor Button */}
              <button
                type="button"
                className="text-xBlue hover:text-xBlue/80"
                onClick={() => setIsCodeEditorOpen(true)}
              >
                <Code size={20} />
              </button>
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || (!comment.trim() && selectedMedia.length === 0)} 
              className="bg-xBlue hover:bg-xBlue/90 text-white font-medium px-4 py-2 rounded-full disabled:opacity-50"
            >
              {isSubmitting ? 'Posting...' : 'Reply'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Code Editor Dialog */}
      <CodeEditorDialog
        open={isCodeEditorOpen}
        onClose={() => setIsCodeEditorOpen(false)}
        onSave={handleCodeSave}
      />
    </form>
  );
};

export default CommentForm;

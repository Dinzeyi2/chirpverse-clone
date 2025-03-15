
import React, { useState } from 'react';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface PostActionMenuProps {
  postId: string;
  isOwner: boolean;
  onPostDeleted?: () => void;
}

const PostActionMenu: React.FC<PostActionMenuProps> = ({ 
  postId, 
  isOwner,
  onPostDeleted
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOwner) return null;

  const handleDeletePost = async () => {
    try {
      setIsDeleting(true);
      
      const { error } = await supabase
        .from('shoutouts')
        .delete()
        .eq('id', postId);
        
      if (error) throw error;
      
      toast.success('Post deleted successfully');
      setIsDeleteDialogOpen(false);
      setIsMenuOpen(false);
      
      if (onPostDeleted) {
        onPostDeleted();
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <PopoverTrigger asChild>
          <button 
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            aria-label="More actions"
          >
            <MoreHorizontal size={18} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-0" align="end" sideOffset={5}>
          <button 
            className="w-full px-3 py-2 text-left text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
            onClick={() => {
              setIsDeleteDialogOpen(true);
              setIsMenuOpen(false);
            }}
          >
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </PopoverContent>
      </Popover>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostActionMenu;

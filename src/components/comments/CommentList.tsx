
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Comment from './Comment';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { MediaItem } from '@/lib/data';

export interface CommentListProps {
  postId: string;
  comments?: any[]; // Comments are optional
}

const CommentList: React.FC<CommentListProps> = ({ postId, comments: initialComments }) => {
  const { user } = useAuth();
  
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:profiles!inner(*)')
        .eq('shoutout_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error("Error fetching comments:", error);
        throw error;
      }

      // Process comments to add required properties
      const processedComments = data?.map(comment => {
        // Parse media if it exists
        let processedMedia: MediaItem[] | undefined;
        if (comment.media) {
          try {
            // If media is a string, try to parse it as JSON
            if (typeof comment.media === 'string') {
              processedMedia = JSON.parse(comment.media);
            } 
            // If it's already an object or array
            else if (Array.isArray(comment.media)) {
              processedMedia = comment.media;
            }
            // If it's an object with images property
            else if (typeof comment.media === 'object' && comment.media !== null) {
              processedMedia = comment.media.images || [];
            }
          } catch (e) {
            console.error("Error parsing media:", e);
            processedMedia = [];
          }
        }

        return {
          ...comment,
          // Add missing properties required by the Comment component
          likes: 0, // Default value
          liked_by_user: false, // Default value
          user: {
            id: comment.user.id || comment.user.user_id,
            username: comment.user.user_id || '',
            avatar: comment.user.avatar_url || '',
            full_name: comment.user.full_name || '',
            verified: false
          },
          media: processedMedia || []
        };
      }) || [];

      return processedComments;
    },
    retry: 1,
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500">Error loading comments.</div>
    );
  }
  
  return (
    <div>
      {comments?.map((comment) => (
        <Comment 
          key={comment.id} 
          comment={comment}
          postId={postId}
          currentUser={user}
        />
      ))}
    </div>
  );
};

export default CommentList;

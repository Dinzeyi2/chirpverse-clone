
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Comment from './Comment';
import { Skeleton } from '@/components/ui/skeleton';
import { Comment as CommentType } from '@/lib/data';

export interface CommentListProps {
  postId: string;
  comments?: CommentType[]; // Make comments optional
}

const CommentList: React.FC<CommentListProps> = ({ postId, comments: initialComments }) => {
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

      // Map the database response to our Comment type
      return data?.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.created_at,
        created_at: comment.created_at, // Include both formats for compatibility
        userId: comment.user_id,
        user: {
          id: comment.user.user_id || comment.user.id,
          username: comment.user.username || '',
          name: comment.user.full_name,
          full_name: comment.user.full_name, // Include for compatibility
          avatar: comment.user.avatar_url || '',
          email: comment.user.email || '',
          verified: Boolean(comment.user.verified) || false,
        },
        // Properly format media if it exists
        media: comment.media ? 
          (Array.isArray(comment.media) ? 
            comment.media.map((item: any) => ({
              type: item.type || 'unknown',
              url: item.url || ''
            })) : 
            null) : 
          null,
        metadata: comment.metadata || null,
        likes: comment.likes || 0,
        liked_by_user: comment.liked_by_user || false
      })) || [];
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
  
  if (!comments || comments.length === 0) {
    return (
      <div className="text-gray-500 text-center p-4">
        No comments yet. Be the first to comment!
      </div>
    );
  }
  
  return (
    <div>
      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;

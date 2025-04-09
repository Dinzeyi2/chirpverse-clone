import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import Comment from './Comment';
import { Skeleton } from '@/components/ui/skeleton';

export interface CommentListProps {
  postId: string;
  comments?: any[]; // Make comments optional
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

      return data || [];
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
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;

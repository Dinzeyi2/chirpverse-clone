
import React from 'react';
import Comment from './Comment';
import CommentForm from './CommentForm';
import { useAuth } from '@/contexts/AuthContext';

interface CommentListProps {
  comments: any[];
  isLoading: boolean;
  onReplyClick?: (commentId: string, username: string) => void;
  postId: string;
  currentUser: any;
}

const CommentList = ({ comments, isLoading, onReplyClick, postId, currentUser }: CommentListProps) => {
  const { user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (!comments || comments.length === 0) {
    return (
      <div className="p-4 text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</p>
      </div>
    );
  }
  
  const renderComment = (comment: any) => (
    <Comment
      key={comment.id}
      comment={comment}
      onReplyClick={user ? onReplyClick : undefined}
      postId={postId}
      currentUser={currentUser}
    />
  );
  
  return (
    <div className="comments-list">
      {comments.map(renderComment)}
    </div>
  );
};

export default CommentList;

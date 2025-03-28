
import React, { useMemo } from 'react';
import { Comment as CommentType } from '@/lib/data';
import Comment from './Comment';

interface CommentListProps {
  comments: CommentType[];
  isLoading?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ comments, isLoading = false }) => {
  // Deduplicate comments by ID
  const uniqueComments = useMemo(() => {
    const uniqueIds = new Set();
    return comments.filter(comment => {
      if (uniqueIds.has(comment.id)) return false;
      uniqueIds.add(comment.id);
      return true;
    });
  }, [comments]);

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xGray font-medium">Loading comments...</p>
      </div>
    );
  }

  if (!uniqueComments || uniqueComments.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xGray font-medium">No comments yet</p>
        <p className="text-xGray text-sm mt-1">Be the first to comment on this post!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-xExtraLightGray">
      {uniqueComments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;

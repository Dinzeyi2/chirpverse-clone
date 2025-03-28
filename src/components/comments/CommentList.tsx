import React, { useMemo } from 'react';
import { Comment as CommentType } from '@/lib/data';
import Comment from './Comment';

interface CommentListProps {
  comments: CommentType[];
  isLoading?: boolean;
}

const CommentList: React.FC<CommentListProps> = ({ comments, isLoading = false }) => {
  // Improved deduplication with consistent sorting to ensure stable order
  const uniqueComments = useMemo(() => {
    const uniqueMap = new Map<string, CommentType>();
    
    // Sort by creation date (newest first) before deduplication
    // This ensures we keep the newest version of each comment
    const sortedComments = [...comments].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Add to map (which automatically handles deduplication by ID)
    sortedComments.forEach(comment => {
      if (!uniqueMap.has(comment.id)) {
        uniqueMap.set(comment.id, comment);
      }
    });
    
    // Convert back to array and maintain sorted order
    return Array.from(uniqueMap.values());
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


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
      new Date(b.createdAt || b.created_at || '').getTime() - 
      new Date(a.createdAt || a.created_at || '').getTime()
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

  // Format comments to match what the Comment component expects
  const formattedComments = uniqueComments.map(comment => ({
    id: comment.id,
    content: comment.content,
    created_at: comment.createdAt || comment.created_at || new Date().toISOString(),
    user: {
      id: comment.userId || comment.user_id || '',
      username: comment.user?.username || 'user',
      avatar: comment.user?.avatar || '',
      full_name: comment.user?.name || 'User',
      verified: comment.user?.verified || false
    },
    media: comment.media || [],
    likes: comment.likes || 0, // Ensure likes has a default value
    liked_by_user: comment.liked_by_user || false // Ensure liked_by_user has a default value
  }));

  return (
    <div className="divide-y divide-xExtraLightGray">
      {formattedComments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;

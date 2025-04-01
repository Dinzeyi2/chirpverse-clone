
import React, { useMemo } from 'react';
import { Comment as CommentType } from '@/lib/data';
import Comment from './Comment';

interface CommentListProps {
  comments: CommentType[];
  isLoading?: boolean;
  onReplyClick?: (commentId: string, username: string) => void;
  postId?: string;
  currentUser?: any;
}

const CommentList: React.FC<CommentListProps> = ({ 
  comments, 
  isLoading = false, 
  onReplyClick,
  postId,
  currentUser
}) => {
  // Group comments by parent-child relationships
  const commentThreads = useMemo(() => {
    if (!comments || !Array.isArray(comments)) {
      return { topLevel: [], repliesByParentId: new Map() };
    }
    
    // First deduplicate comments
    const uniqueMap = new Map<string, CommentType>();
    
    // Sort by creation date (newest first) before deduplication
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
    
    const uniqueComments = Array.from(uniqueMap.values());
    
    // Now organize into threads
    const topLevelComments: CommentType[] = [];
    const repliesByParentId = new Map<string, CommentType[]>();
    
    uniqueComments.forEach(comment => {
      // Check if this is a reply
      const metadata = comment.metadata && typeof comment.metadata === 'object' ? comment.metadata : {};
      const parentId = metadata.parent_id || 
                      (metadata.reply_to && metadata.reply_to.comment_id) || 
                      null;
      
      if (parentId) {
        // This is a reply
        if (!repliesByParentId.has(parentId)) {
          repliesByParentId.set(parentId, []);
        }
        repliesByParentId.get(parentId)!.push(comment);
      } else {
        // This is a top-level comment
        topLevelComments.push(comment);
      }
    });
    
    // Sort replies by date (newest replies first)
    repliesByParentId.forEach((replies, parentId) => {
      repliesByParentId.set(
        parentId,
        replies.sort((a, b) => 
          new Date(b.createdAt || b.created_at || '').getTime() - 
          new Date(a.createdAt || a.created_at || '').getTime()
        )
      );
    });
    
    return {
      topLevel: topLevelComments.sort((a, b) => 
        new Date(b.createdAt || b.created_at || '').getTime() - 
        new Date(a.createdAt || a.created_at || '').getTime()
      ),
      repliesByParentId
    };
  }, [comments]);

  if (isLoading) {
    return (
      <div className="py-6 text-center">
        <p className="text-xGray font-medium">Loading comments...</p>
      </div>
    );
  }

  if (!commentThreads.topLevel || commentThreads.topLevel.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xGray font-medium">No comments yet</p>
        <p className="text-xGray text-sm mt-1">Be the first to comment on this post!</p>
      </div>
    );
  }

  // Format comments to match what the Comment component expects
  const formatComment = (comment: CommentType) => {
    // Safely handle media
    let formattedMedia = [];
    if (comment.media && Array.isArray(comment.media)) {
      formattedMedia = comment.media.map(media => {
        if (typeof media === 'string') {
          return { type: 'image', url: media };
        } else if (media && typeof media === 'object') {
          return {
            type: media.type || 'unknown',
            url: media.url || ''
          };
        }
        return { type: 'unknown', url: '' };
      });
    }
    
    // Ensure metadata is an object
    const metadata = typeof comment.metadata === 'object' ? comment.metadata : {};
    
    return {
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
      media: formattedMedia,
      likes: comment.likes || 0,
      liked_by_user: comment.liked_by_user || false,
      metadata: metadata
    };
  };

  return (
    <div className="divide-y divide-xExtraLightGray">
      {commentThreads.topLevel.map(comment => {
        const formattedComment = formatComment(comment);
        const replies = commentThreads.repliesByParentId.get(comment.id) || [];
        const formattedReplies = replies.map(reply => formatComment(reply));
        
        return (
          <Comment 
            key={comment.id} 
            comment={formattedComment}
            onReplyClick={currentUser ? onReplyClick : undefined}
            postId={postId}
            currentUser={currentUser}
            replies={formattedReplies}
            canReply={!!currentUser}
          />
        );
      })}
    </div>
  );
};

export default CommentList;

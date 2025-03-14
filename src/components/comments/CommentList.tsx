
import React from 'react';
import { Comment as CommentType } from '@/lib/data';
import Comment from './Comment';

interface CommentListProps {
  comments: CommentType[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  if (comments.length === 0) {
    return (
      <div className="py-6 text-center">
        <p className="text-xGray font-medium">No comments yet</p>
        <p className="text-xGray text-sm mt-1">Be the first to comment on this post!</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-xExtraLightGray max-h-[400px] overflow-y-auto">
      {comments.map(comment => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default CommentList;

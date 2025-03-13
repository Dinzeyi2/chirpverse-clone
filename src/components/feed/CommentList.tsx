
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/data';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
}

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => {
  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div key={comment.id} className="flex space-x-3 animate-fade-in">
          <div className="flex-shrink-0">
            <img
              src={comment.user.avatar}
              alt={comment.user.name}
              className="w-10 h-10 rounded-full"
            />
          </div>
          <div className="flex-grow">
            <div className="flex items-center">
              <span className="font-bold mr-1 hover:underline cursor-pointer">
                {comment.user.name}
              </span>
              
              {comment.user.verified && (
                <span className="text-xBlue mr-1">
                  <CheckCircle size={16} className="fill-xBlue text-white" />
                </span>
              )}
              
              <span className="text-xGray">@{comment.user.username}</span>
              <span className="text-xGray mx-1">·</span>
              <span className="text-xGray">{formatDate(comment.createdAt)}</span>
            </div>
            
            <div className="mt-1">
              <p className="whitespace-pre-line">{comment.content}</p>
            </div>
            
            <div className="flex mt-2 text-xGray text-sm max-w-md">
              <button className="flex items-center mr-4 hover:text-xBlue">
                <div className="p-1.5 rounded-full hover:bg-blue-50">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </button>
              
              <button className="flex items-center hover:text-xBlue">
                <div className="p-1.5 rounded-full hover:bg-blue-50">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommentList;
